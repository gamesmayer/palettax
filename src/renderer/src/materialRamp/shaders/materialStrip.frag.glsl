#version 300 es
precision highp float;

// Mirrors src/shared/materialRamp/brdf.ts function-for-function, and the
// final cos/sin step of src/shared/materialRamp/orientationSweep.ts's
// normalAtT -- keep all three in sync by hand; see brdf.ts's and
// orientationSweep.ts's Jest tests for reference values. The Gram-Schmidt
// basis construction (computeSweepBasis) stays CPU-side and is uploaded as
// uSweepE1/uSweepE2/uSweepPhi, so this shader only needs to mirror the cheap
// final combination, not the acos/degenerate-guard logic. This file is the
// GPU path used for the real dense-sampling pipeline; brdf.ts doubles as
// the CPU oracle/fallback and is what's actually unit-tested, since Jest
// has no WebGL context to exercise this shader directly.

uniform vec3 uBaseColorLinear;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3 uLightColorLinear;
uniform float uLightIntensity;
uniform vec3 uLightDir;
uniform vec3 uViewDir;
uniform vec3 uSweepE1;
uniform vec3 uSweepE2;
uniform float uSweepPhi;
uniform vec3 uAmbientColorLinear;
uniform float uAmbientIntensity;
uniform int uWidth;

out vec4 fragColor;

const float DIELECTRIC_F0 = 0.04;
const float PI = 3.14159265358979323846;
const float HALF_PI = 1.5707963267948966;
// Cancels the diffuse term's 1/PI Lambertian normalization -- see LIGHT_POWER in brdf.ts.
const float LIGHT_POWER = PI;

float ggxDistribution(float NdotH, float alpha) {
	float alpha2 = alpha * alpha;
	float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
	return alpha2 / (PI * denom * denom);
}

float schlickGGXGeometry(float NdotX, float alpha) {
	float k = alpha / 2.0;
	return NdotX / (NdotX * (1.0 - k) + k);
}

float smithGeometry(float NdotL, float NdotV, float alpha) {
	return schlickGGXGeometry(NdotL, alpha) * schlickGGXGeometry(NdotV, alpha);
}

vec3 schlickFresnel(float VdotH, vec3 f0) {
	float factor = pow(1.0 - VdotH, 5.0);
	return f0 + (vec3(1.0) - f0) * factor;
}

vec3 reinhardTonemap(vec3 c) {
	return c / (vec3(1.0) + c);
}

void main() {
	float t = (gl_FragCoord.x - 0.5) / float(uWidth - 1);
	float alpha_ = (uSweepPhi - HALF_PI) + HALF_PI * t;
	vec3 N = cos(alpha_) * uSweepE1 + sin(alpha_) * uSweepE2;

	vec3 L = normalize(uLightDir);
	vec3 V = normalize(uViewDir);
	vec3 H = normalize(L + V);

	float NdotL = max(dot(N, L), 1e-4);
	float NdotV = max(dot(N, V), 1e-4);
	float NdotH = max(dot(N, H), 0.0);
	float VdotH = max(dot(V, H), 0.0);

	vec3 f0 = mix(vec3(DIELECTRIC_F0), uBaseColorLinear, uMetallic);
	vec3 albedoDiffuse = uBaseColorLinear * (1.0 - uMetallic);
	float alpha = max(uRoughness * uRoughness, 1e-4);

	float D = ggxDistribution(NdotH, alpha);
	float G = smithGeometry(NdotL, NdotV, alpha);
	vec3 F = schlickFresnel(VdotH, f0);

	float specularDenom = max(4.0 * NdotV * NdotL, 1e-4);
	vec3 specular = F * (D * G / specularDenom);

	vec3 kd = (vec3(1.0) - F) * (1.0 - uMetallic);
	vec3 diffuse = (kd * albedoDiffuse) / PI;

	vec3 radiance = uLightColorLinear * (uLightIntensity * LIGHT_POWER * NdotL);
	vec3 directLit = (diffuse + specular) * radiance;

	vec3 fresnelAmbient = schlickFresnel(NdotV, f0);
	vec3 ambientDiffuse = uAmbientColorLinear * uAmbientIntensity * albedoDiffuse;
	vec3 ambientSpecular = uAmbientColorLinear * uAmbientIntensity * fresnelAmbient;
	vec3 ambientLit = ambientDiffuse + ambientSpecular;

	fragColor = vec4(reinhardTonemap(directLit + ambientLit), 1.0);
}
