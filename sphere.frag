float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

// Trilinear value noise over the surrounding unit cell:
//
//   n000 ---- n100
//    |          |
//   n010 ---- n110    then blended along x, y, z using u
//
float smoothNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0, 0, 0));
    float n100 = hash(i + vec3(1, 0, 0));
    float n010 = hash(i + vec3(0, 1, 0));
    float n110 = hash(i + vec3(1, 1, 0));
    float n001 = hash(i + vec3(0, 0, 1));
    float n101 = hash(i + vec3(1, 0, 1));
    float n011 = hash(i + vec3(0, 1, 1));
    float n111 = hash(i + vec3(1, 1, 1));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
}

/*
    Base shape: sphere
        d_sphere(p) = length(p) - 1

    Then we domain-warp where the detail noise is sampled:

        p ----------> warpP ----------> noise(warpP * 20)
         \             ^
          \            |
           +-- low-frequency noise(p * 6)

    That lets the surface keep the broad silhouette of a sphere while the
    local normal field becomes much more interesting.
*/
float calcDist(vec3 p) {
    float base = length(p) - 1.0;
    // Domain-warped, higher frequency noise so normal differences are visible.
    vec3 warpP = p + (smoothNoise(p * 6.0) - 0.5) * 0.2;
    float n = smoothNoise(warpP * 20.0);
    float warp = (n - sin(iTime) * 0.9) * 0.15;
    return base + warp;
}

/*
    6-sample central-difference gradient / normal.

              p + e*z
                 |
                 |
    p - e*y ---- p ---- p + e*y
               /   \
          p-e*x     p+e*x
                 |
                 |
              p - e*z

    Each axis is measured symmetrically:
      d/dx ~= f(p + e*x) - f(p - e*x)
      d/dy ~= f(p + e*y) - f(p - e*y)
      d/dz ~= f(p + e*z) - f(p - e*z)

    Pros:
      - straightforward and accurate
    Cost:
      - 6 extra SDF evaluations
*/
vec3 calcNorm(vec3 p) {
    float e = 0.001;
    vec2 h = vec2(e, 0.0);
    return normalize(vec3(
        calcDist(p + h.xyy) - calcDist(p - h.xyy),
        calcDist(p + h.yxy) - calcDist(p - h.yxy),
        calcDist(p + h.yyx) - calcDist(p - h.yyx)
    ));
}

/*
    4-sample tetrahedral gradient / normal.

                  v4 (-,-,+)
                     /|\
                    / | \
                   /  |  \
      v3 (-,+,-) --   p   -- v1 (+,+,+)
                   \  |  /
                    \ | /
                     \|/
                  v2 (+,-,-)

    We probe the SDF along four diagonal directions and weight each sample by
    its direction vector. This collapses the gradient estimate down to four
    evaluations instead of six.

    Pros:
      - fewer samples than central difference
      - nicely symmetric layout
    Cost:
      - 4 extra SDF evaluations
*/
vec3 calcNormTetra(vec3 p) {
    float e = 0.001;
    vec3 v1 = vec3(1, 1, 1);
    vec3 v2 = vec3(1, -1, -1);
    vec3 v3 = vec3(-1, 1, -1);
    vec3 v4 = vec3(-1, -1, 1);
    return normalize(vec3(
        v1 * calcDist(p + e * v1) +
        v2 * calcDist(p + e * v2) +
        v3 * calcDist(p + e * v3) +
        v4 * calcDist(p + e * v4)
    ));
}

/*
    3-sample forward-difference gradient / normal.

                  p + e*z
                     |
                     |
           p + e*y --p-- p + e*x

    This estimator assumes we already know f(p) from the raymarch hit.
    That means we can reuse the current SDF value and only sample the
    positive axis directions:

      d/dx ~= f(p + e*x) - f(p)
      d/dy ~= f(p + e*y) - f(p)
      d/dz ~= f(p + e*z) - f(p)

    Pros:
      - cheapest of the three when the hit distance is already known
    Cost:
      - 3 extra SDF evaluations after the march step
*/
vec3 calcNormTri(vec3 p, float sdf_d) {
    float e = 0.001;
    vec3 v1 = vec3(1, 0, 0);
    vec3 v2 = vec3(0, 1, 0);
    vec3 v3 = vec3(0, 0, 1);
    return normalize(vec3(
        calcDist(p + e * v1) - sdf_d,
        calcDist(p + e * v2) - sdf_d,
        calcDist(p + e * v3) - sdf_d
    ));
}

/*
    Camera + raymarch:

      camera ----ray----> bounding sphere ----> warped surface

    The cheap bounding-sphere test rejects obvious misses before we spend
    time marching the noisy SDF. On hit, we estimate the gradient and map
    the normal from [-1, 1] into display RGB [0, 1].
*/
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 invRes = 1.0 / iResolution.xy;
    vec2 uv = fragCoord * invRes * 2.0 - 1.0;
    uv.x *= iResolution.x * invRes.y;

    vec3 camera = vec3(0.0, 0.0, -2.0);
    vec3 rayDir = normalize(vec3(uv, 1.0));

    const float EPS = 0.1;
    const float MAX_DIST = 6.0;
    const int MAX_STEPS = 30;
    const float BOUND_R = 1.4;
    float t = 0.0;
    vec3 p;
    vec3 col = vec3(0.0);

    // Bounding sphere for the scene to skip rays that miss.
    vec3 oc = camera;
    float b = dot(oc, rayDir);
    float c = dot(oc, oc) - BOUND_R * BOUND_R;
    float h = b * b - c;
    if (h > 0.0) {
        float sqrtH = sqrt(h);
        float t0 = -b - sqrtH;
        float t1 = -b + sqrtH;
        if (t1 > 0.0) {
            t = max(t0, 0.0);
            float tMax = min(t1, MAX_DIST);
            for (int i = 0; i < MAX_STEPS; i++) {
                p = camera + rayDir * t;
                float d = calcDist(p);
                if (d < EPS) {
                    // Swap between normal estimators here:
                    //
                    //   normalize(p)     : analytic sphere normal only
                    //   calcNorm(p)      : 6-sample central difference
                    //   calcNormTetra(p) : 4-sample tetrahedral estimate
                    //   calcNormTri(p,d) : 3-sample forward difference
                    //
                    // The chosen normal is visualized directly as color.
                    // vec3 normal = normalize(p);
                    // vec3 normal = calcNorm(p);
                    // vec3 normal = calcNormTetra(p);
                    vec3 normal = calcNormTri(p, d);
                    col = normal * 0.5 + 0.5;
                    break;
                }
                t += d;
                if (t > tMax) {
                    break;
                }
            }
        }
    }


    fragColor = vec4(col, 1.0);
}
