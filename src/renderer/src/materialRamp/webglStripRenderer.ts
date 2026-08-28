import { rgbBytesToLinear } from "../../../shared/materialRamp/colorSpace";
import { EnvironmentMap } from "../../../shared/materialRamp/environmentMap";
import { computeSweepBasis } from "../../../shared/materialRamp/orientationSweep";
import {
	LightingConfig,
	MaterialDefinition,
} from "../../../shared/materialRamp/types";
import fragSource from "./shaders/materialStrip.frag.glsl?raw";
import vertSource from "./shaders/materialStrip.vert.glsl?raw";

export interface StripRenderResult {
	samples: Float32Array; // length width*4, RGBA linear (alpha unused)
	precision: "float" | "uint8";
}

interface Uniforms {
	uBaseColorLinear: WebGLUniformLocation | null;
	uMetallic: WebGLUniformLocation | null;
	uRoughness: WebGLUniformLocation | null;
	uLightColorLinear: WebGLUniformLocation | null;
	uLightIntensity: WebGLUniformLocation | null;
	uLightDir: WebGLUniformLocation | null;
	uViewDir: WebGLUniformLocation | null;
	uSweepE1: WebGLUniformLocation | null;
	uSweepE2: WebGLUniformLocation | null;
	uSweepPhi: WebGLUniformLocation | null;
	uAmbientColorLinear: WebGLUniformLocation | null;
	uAmbientIntensity: WebGLUniformLocation | null;
	uWidth: WebGLUniformLocation | null;
	uEnvironmentMap: WebGLUniformLocation | null;
	uHasEnvironmentMap: WebGLUniformLocation | null;
	uEnvironmentIntensity: WebGLUniformLocation | null;
	uEnvironmentMaxLod: WebGLUniformLocation | null;
}

const ENVIRONMENT_TEXTURE_UNIT = 1;

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string
): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("Failed to create shader");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Shader compile error: ${info}`);
	}
	return shader;
}

/**
 * Lazily-initialized singleton WebGL2 renderer for the 1D material-response
 * strip: a `width x 1` framebuffer where pixel x represents an orientation
 * sweep position `t = x / (width - 1)` (see orientationSweep.ts) -- the
 * fragment shader derives a surface normal from `t` and evaluates the BRDF
 * at that normal, with light/view direction and intensity fixed. Reused
 * across generate calls (not recreated per call) since live preview
 * recomputes on every param change -- a fresh context per call would risk
 * Chromium's per-page live-context ceiling for no benefit, given a 512x1
 * render is sub-millisecond.
 */
class MaterialStripRenderer {
	private canvas: HTMLCanvasElement | null = null;
	private gl: WebGL2RenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private vao: WebGLVertexArrayObject | null = null;
	private fbo: WebGLFramebuffer | null = null;
	private texture: WebGLTexture | null = null;
	private targetWidth = 0;
	private precision: "float" | "uint8" = "uint8";
	private needsInit = true;
	private uniforms: Uniforms | null = null;
	private environmentTexture: WebGLTexture | null = null;
	private uploadedEnvironmentMap: EnvironmentMap | null = null;
	private environmentMaxLod = 0;

	private handleContextLost = (event: Event): void => {
		event.preventDefault();
		this.needsInit = true;
		this.gl = null;
		this.program = null;
		this.vao = null;
		this.fbo = null;
		this.texture = null;
		this.targetWidth = 0;
		this.environmentTexture = null;
		this.uploadedEnvironmentMap = null;
	};

	private handleContextRestored = (): void => {
		this.needsInit = true;
	};

	private ensureContext(): WebGL2RenderingContext | null {
		if (this.gl && !this.needsInit) return this.gl;

		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
			this.canvas.addEventListener(
				"webglcontextrestored",
				this.handleContextRestored
			);
		}

		const gl = this.canvas.getContext("webgl2");
		if (!gl) return null;

		this.gl = gl;
		this.compileProgram(gl);
		this.needsInit = false;
		return gl;
	}

	private compileProgram(gl: WebGL2RenderingContext): void {
		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);

		const program = gl.createProgram();
		if (!program) throw new Error("Failed to create program");
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Program link error: ${info}`);
		}

		this.program = program;
		this.uniforms = {
			uBaseColorLinear: gl.getUniformLocation(program, "uBaseColorLinear"),
			uMetallic: gl.getUniformLocation(program, "uMetallic"),
			uRoughness: gl.getUniformLocation(program, "uRoughness"),
			uLightColorLinear: gl.getUniformLocation(program, "uLightColorLinear"),
			uLightIntensity: gl.getUniformLocation(program, "uLightIntensity"),
			uLightDir: gl.getUniformLocation(program, "uLightDir"),
			uViewDir: gl.getUniformLocation(program, "uViewDir"),
			uSweepE1: gl.getUniformLocation(program, "uSweepE1"),
			uSweepE2: gl.getUniformLocation(program, "uSweepE2"),
			uSweepPhi: gl.getUniformLocation(program, "uSweepPhi"),
			uAmbientColorLinear: gl.getUniformLocation(
				program,
				"uAmbientColorLinear"
			),
			uAmbientIntensity: gl.getUniformLocation(program, "uAmbientIntensity"),
			uWidth: gl.getUniformLocation(program, "uWidth"),
			uEnvironmentMap: gl.getUniformLocation(program, "uEnvironmentMap"),
			uHasEnvironmentMap: gl.getUniformLocation(program, "uHasEnvironmentMap"),
			uEnvironmentIntensity: gl.getUniformLocation(
				program,
				"uEnvironmentIntensity"
			),
			uEnvironmentMaxLod: gl.getUniformLocation(program, "uEnvironmentMaxLod"),
		};

		// A 1x1 placeholder keeps the sampler bound to a valid texture even when
		// no environment map is active (uHasEnvironmentMap gates the actual
		// lookup in the shader) -- avoids "texture unit not renderable" driver
		// warnings from an unbound sampler.
		this.environmentTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + ENVIRONMENT_TEXTURE_UNIT);
		gl.bindTexture(gl.TEXTURE_2D, this.environmentTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array([0, 0, 0, 255])
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		this.uploadedEnvironmentMap = null;
		this.environmentMaxLod = 0;
		// Restore the default active unit -- ensureTarget()'s gl.bindTexture
		// calls below (and on every later resize) assume unit 0, matching
		// every other texture call in this class that never touches
		// activeTexture explicitly.
		gl.activeTexture(gl.TEXTURE0);

		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		// full-screen quad, drawn as a triangle strip
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW
		);
		const positionLoc = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
		this.vao = vao;
	}

	private ensureTarget(gl: WebGL2RenderingContext, width: number): boolean {
		if (this.fbo && this.texture && this.targetWidth === width) return true;

		if (this.canvas) {
			this.canvas.width = width;
			this.canvas.height = 1;
		}
		if (this.texture) gl.deleteTexture(this.texture);
		if (this.fbo) gl.deleteFramebuffer(this.fbo);

		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// Tier 1: WebGL2 + float render target. Tier 2 fallback: plain 8-bit.
		// Electron ships a fixed, modern Chromium/ANGLE, so tier 1 succeeds on
		// effectively every real machine this app runs on -- a WebGL1
		// extension ladder isn't warranted here.
		const floatExt = gl.getExtension("EXT_color_buffer_float");
		if (floatExt) {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA32F,
				width,
				1,
				0,
				gl.RGBA,
				gl.FLOAT,
				null
			);
			this.precision = "float";
		} else {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA8,
				width,
				1,
				0,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				null
			);
			this.precision = "uint8";
		}

		const fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0
		);
		const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		if (status !== gl.FRAMEBUFFER_COMPLETE) {
			gl.deleteTexture(texture);
			gl.deleteFramebuffer(fbo);
			this.texture = null;
			this.fbo = null;
			this.targetWidth = 0;
			return false;
		}

		this.texture = texture;
		this.fbo = fbo;
		this.targetWidth = width;
		return true;
	}

	/**
	 * Uploads `environmentMap`'s full-resolution sRGB image as an SRGB8_ALPHA8
	 * GPU texture (hardware decodes sRGB->linear on sample, so this doesn't
	 * duplicate the CPU-side conversion in GLSL) and generates real mipmaps
	 * for roughness-driven blur -- the GPU-native counterpart to the manual
	 * box-downsample mip chain `environmentMap.ts` builds for the CPU path.
	 * SRGB8_ALPHA8, not SRGB8: WebGL2/ES3 only guarantees generateMipmap for
	 * color-renderable formats, and plain SRGB8 isn't required to be (raises
	 * "Texture format does not support mipmap generation"). No-ops if this
	 * exact map object was already uploaded (reference equality, same
	 * reuse-across-calls convention as the rest of this class).
	 */
	private ensureEnvironmentTexture(
		gl: WebGL2RenderingContext,
		environmentMap: EnvironmentMap | null | undefined
	): void {
		if (!environmentMap || this.uploadedEnvironmentMap === environmentMap) {
			return;
		}

		const base = environmentMap.levels[0];
		const rgba = new Uint8Array(base.width * base.height * 4);
		for (let i = 0; i < base.width * base.height; i++) {
			rgba[i * 4] = environmentMap.srgbBytes[i * 3];
			rgba[i * 4 + 1] = environmentMap.srgbBytes[i * 3 + 1];
			rgba[i * 4 + 2] = environmentMap.srgbBytes[i * 3 + 2];
			rgba[i * 4 + 3] = 255;
		}

		gl.activeTexture(gl.TEXTURE0 + ENVIRONMENT_TEXTURE_UNIT);
		gl.bindTexture(gl.TEXTURE_2D, this.environmentTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.SRGB8_ALPHA8,
			base.width,
			base.height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			rgba
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // u wraps around the horizon
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // v does not
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR_MIPMAP_LINEAR
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		// Restore the default active unit -- see the matching comment in
		// compileProgram; ensureTarget()'s texture calls assume unit 0.
		gl.activeTexture(gl.TEXTURE0);

		this.uploadedEnvironmentMap = environmentMap;
		this.environmentMaxLod = Math.log2(Math.max(base.width, base.height));
	}

	/** Renders the material-response strip and reads it back as linear RGBA. Returns null if WebGL2 (or a usable render target) isn't available at all. */
	render(
		material: MaterialDefinition,
		lighting: LightingConfig,
		width: number
	): StripRenderResult | null {
		const gl = this.ensureContext();
		if (!gl || !this.program || !this.uniforms) return null;
		if (!this.ensureTarget(gl, width)) return null;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, width, 1);
		gl.useProgram(this.program);
		gl.bindVertexArray(this.vao);

		// sRGB->linear conversion happens once here, before upload -- the one
		// documented conversion point, not duplicated in GLSL (spec point 12).
		const baseLinear = rgbBytesToLinear(material.baseColor);
		const lightLinear = rgbBytesToLinear(lighting.directionalLightColor);
		const ambientLinear = rgbBytesToLinear(lighting.ambientLightColor);
		const basis = computeSweepBasis(lighting);

		gl.uniform3f(
			this.uniforms.uBaseColorLinear,
			baseLinear.r,
			baseLinear.g,
			baseLinear.b
		);
		gl.uniform1f(this.uniforms.uMetallic, material.metallic);
		gl.uniform1f(this.uniforms.uRoughness, material.roughness);
		gl.uniform3f(
			this.uniforms.uLightColorLinear,
			lightLinear.r,
			lightLinear.g,
			lightLinear.b
		);
		gl.uniform1f(
			this.uniforms.uLightIntensity,
			lighting.directionalLightIntensity
		);
		gl.uniform3f(
			this.uniforms.uLightDir,
			lighting.directionalLightDir[0],
			lighting.directionalLightDir[1],
			lighting.directionalLightDir[2]
		);
		gl.uniform3f(
			this.uniforms.uViewDir,
			lighting.viewDir[0],
			lighting.viewDir[1],
			lighting.viewDir[2]
		);
		gl.uniform3f(this.uniforms.uSweepE1, basis.e1[0], basis.e1[1], basis.e1[2]);
		gl.uniform3f(this.uniforms.uSweepE2, basis.e2[0], basis.e2[1], basis.e2[2]);
		gl.uniform1f(this.uniforms.uSweepPhi, basis.phi);
		gl.uniform3f(
			this.uniforms.uAmbientColorLinear,
			ambientLinear.r,
			ambientLinear.g,
			ambientLinear.b
		);
		gl.uniform1f(
			this.uniforms.uAmbientIntensity,
			lighting.ambientLightIntensity
		);
		gl.uniform1i(this.uniforms.uWidth, width);

		if (lighting.environmentMap) {
			this.ensureEnvironmentTexture(gl, lighting.environmentMap);
			gl.uniform1i(this.uniforms.uHasEnvironmentMap, 1);
			gl.uniform1f(
				this.uniforms.uEnvironmentIntensity,
				lighting.environmentIntensity
			);
			gl.uniform1f(this.uniforms.uEnvironmentMaxLod, this.environmentMaxLod);
		} else {
			gl.uniform1i(this.uniforms.uHasEnvironmentMap, 0);
		}
		gl.uniform1i(this.uniforms.uEnvironmentMap, ENVIRONMENT_TEXTURE_UNIT);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		let samples: Float32Array;
		if (this.precision === "float") {
			const buffer = new Float32Array(width * 4);
			gl.readPixels(0, 0, width, 1, gl.RGBA, gl.FLOAT, buffer);
			samples = buffer;
		} else {
			const buffer = new Uint8Array(width * 4);
			gl.readPixels(0, 0, width, 1, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
			samples = new Float32Array(width * 4);
			for (let i = 0; i < buffer.length; i++) {
				samples[i] = buffer[i] / 255;
			}
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindVertexArray(null);

		return { samples, precision: this.precision };
	}

	dispose(): void {
		if (this.gl) {
			if (this.texture) this.gl.deleteTexture(this.texture);
			if (this.environmentTexture)
				this.gl.deleteTexture(this.environmentTexture);
			if (this.fbo) this.gl.deleteFramebuffer(this.fbo);
			if (this.program) this.gl.deleteProgram(this.program);
			if (this.vao) this.gl.deleteVertexArray(this.vao);
		}
		if (this.canvas) {
			this.canvas.removeEventListener(
				"webglcontextlost",
				this.handleContextLost
			);
			this.canvas.removeEventListener(
				"webglcontextrestored",
				this.handleContextRestored
			);
		}
		this.canvas = null;
		this.gl = null;
		this.program = null;
		this.vao = null;
		this.fbo = null;
		this.texture = null;
		this.targetWidth = 0;
		this.uniforms = null;
		this.needsInit = true;
		this.environmentTexture = null;
		this.uploadedEnvironmentMap = null;
	}
}

export const materialStripRenderer = new MaterialStripRenderer();
