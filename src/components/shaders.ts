export const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uScroll;

varying vec2 vUv;

// 3D Simplex Noise
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; 
  vec3 x3 = x0 - D.yyy;      

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857; 
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// Procedural ASCII Character Rendering (5x7 grid inside 10x10 cell)
float character(float n, vec2 p) {
  int px = int(floor(p.x * 5.0));
  int py = int(floor(p.y * 7.0));
  
  if(px >= 0 && px <= 4 && py >= 0 && py <= 6) {
    int c = int(floor(n * 10.0));
    
    if(c == 0) return 0.0;
    if(c == 1) return (px == 2 && py == 1) ? 1.0 : 0.0;
    if(c == 2) return (px == 2 && py < 2) ? 1.0 : 0.0;
    if(c == 3) return (px == 2 && (py == 1 || py == 4)) ? 1.0 : 0.0;
    if(c == 4) return (px == 2 && (py < 2 || py == 4)) ? 1.0 : 0.0;
    if(c == 5) return ((px == 2 && py > 1 && py < 5) || (py == 3 && px > 0 && px < 4)) ? 1.0 : 0.0;
    if(c == 6) return ((px == 2 && py > 1 && py < 5) || (py == 3 && px > 0 && px < 4) || ((px == 1 || px == 3) && (py == 2 || py == 4))) ? 1.0 : 0.0;
    if(c == 7) return ((py == 6 && px > 0 && px < 4) || (px == 4 && py > 3 && py < 6) || (py == 3 && px > 1 && px < 5) || (px == 2 && py == 2) || (px == 2 && py == 0)) ? 1.0 : 0.0;
    if(c == 8) return ((px == int(float(py) * 5.0/7.0)) || (px < 2 && py > 4) || (px > 2 && py < 3)) ? 1.0 : 0.0;
    if(c == 9) return ((py == 6 && px > 0) || (px == 0 && py > 3) || (py == 3 && px > 0 && px < 4) || (px == 4 && py < 3) || (py == 0 && px < 4)) ? 1.0 : 0.0;
    if(c == 10) return ((px == 1 || px == 3) || (py == 2 || py == 4)) ? 1.0 : 0.0;
    return ((px == 0 || px == 4 || py == 0 || py == 6 || (px == 2 && py == 3))) ? 1.0 : 0.0;
  }
  return 0.0;
}

void main() {
  vec2 coord = vUv * uResolution.xy;
  
  vec2 cell = floor(coord / 10.0);
  vec2 cellUv = fract(coord / 10.0);
  
  vec2 charUv = (cellUv - vec2(0.25, 0.15)) * vec2(1.5, 1.4);
  
  vec2 parallax = uMouse * 0.15;
  float scrollShift = uScroll * 0.0005;
  
  vec2 noiseCoord = cell * 0.05 + parallax;
  float time = uTime * 0.3;
  
  float n1 = snoise(vec3(noiseCoord, time));
  float n2 = snoise(vec3(noiseCoord * 2.0 - time * 0.5, time * 0.8));
  
  float noise = (n1 + n2 * 0.5) / 1.5; 
  noise = clamp(noise * 0.5 + 0.5 + scrollShift, 0.0, 1.0);
  
  float charBrightness = character(noise, charUv);
  
  vec3 bgColor = vec3(0.039, 0.078, 0.063); 
  vec3 charColor = vec3(0.027, 0.584, 0.373); 
  vec3 highlightColor = vec3(0.988, 1.0, 0.322); 
  
  vec3 finalCharColor = mix(charColor, highlightColor, smoothstep(0.8, 1.0, noise));
  
  float scanline = mod(coord.y, 4.0) < 2.0 ? 0.85 : 1.0;
  
  vec3 color = bgColor;
  if(charBrightness > 0.0) {
    color = mix(bgColor, finalCharColor, 0.85 * scanline);
  } else {
    color *= scanline * 0.95; 
  }
  
  float dist = distance(vUv, vec2(0.5));
  color *= smoothstep(0.8, 0.2, dist);
  
  gl_FragColor = vec4(color, 1.0);
}
`;
