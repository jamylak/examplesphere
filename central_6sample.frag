// SDF for a sphere
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// SDF for a line segment (capsule)
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// Scene: 6 small spheres at the central-difference sample points + axis bars
float calcDist(vec3 p) {
    float e = 0.5;

    // 6 central-difference sample points (positive and negative axes)
    vec3 xp = vec3( 1,  0,  0);
    vec3 xn = vec3(-1,  0,  0);
    vec3 yp = vec3( 0,  1,  0);
    vec3 yn = vec3( 0, -1,  0);
    vec3 zp = vec3( 0,  0,  1);
    vec3 zn = vec3( 0,  0, -1);
    vec3 origin = vec3(0, 0, 0);

    // 6 spheres at the probe positions
    float d1 = sdSphere(p - e * xp, 0.15);
    float d2 = sdSphere(p - e * xn, 0.15);
    float d3 = sdSphere(p - e * yp, 0.15);
    float d4 = sdSphere(p - e * yn, 0.15);
    float d5 = sdSphere(p - e * zp, 0.15);
    float d6 = sdSphere(p - e * zn, 0.15);

    // Center sphere (sample origin)
    float center = sdSphere(p, 0.2);

    // Axis bars connecting opposite sample points through the origin
    float xAxis = sdCapsule(p, e * xn, e * xp, 0.03);
    float yAxis = sdCapsule(p, e * yn, e * yp, 0.03);
    float zAxis = sdCapsule(p, e * zn, e * zp, 0.03);

    // Combine spheres
    float spheres = min(min(min(d1, d2), min(d3, d4)), min(min(d5, d6), center));

    // Combine axis bars
    float axes = min(xAxis, min(yAxis, zAxis));

    // Combine all
    return min(spheres, axes);
}

// 6-sample central difference normal
vec3 calcNormal(vec3 p) {
    float e = 0.001;
    return normalize(vec3(
        calcDist(p + vec3(e, 0, 0)) - calcDist(p - vec3(e, 0, 0)),
        calcDist(p + vec3(0, e, 0)) - calcDist(p - vec3(0, e, 0)),
        calcDist(p + vec3(0, 0, e)) - calcDist(p - vec3(0, 0, e))
    ));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Camera
    vec3 ro = vec3(0, 0, 3);
    vec3 rd = normalize(vec3(uv, -1.5));

    // Rotate camera based on mouse + auto-rotate
    vec2 mouse = iMouse.xy / iResolution.xy;
    float angleX = iTime * -0.3 + (0.5 - mouse.x) * 6.28;
    float angleY = sin(iTime * 0.2) * 0.5 + (mouse.y - 0.5) * 3.14;

    mat2 rotX = mat2(cos(angleX), -sin(angleX), sin(angleX), cos(angleX));
    mat2 rotY = mat2(cos(angleY), -sin(angleY), sin(angleY), cos(angleY));
    ro.xz = rotX * ro.xz;
    ro.yz = rotY * ro.yz;
    rd.xz = rotX * rd.xz;
    rd.yz = rotY * rd.yz;

    // Raymarch
    float t = 0.0;
    vec3 col = vec3(0.1, 0.15, 0.2);

    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = calcDist(p);
        if (d < 0.001) {
            vec3 normal = calcNormal(p);
            vec3 lightDir = normalize(vec3(1, 1, 1));

            // Color based on which probe sphere we hit
            vec3 baseCol = vec3(0.8, 0.3, 0.2);
            float e = 0.5;
            vec3 xp = vec3( 1,  0,  0);
            vec3 xn = vec3(-1,  0,  0);
            vec3 yp = vec3( 0,  1,  0);
            vec3 yn = vec3( 0, -1,  0);
            vec3 zp = vec3( 0,  0,  1);
            vec3 zn = vec3( 0,  0, -1);

            if (length(p - e * xp) < 0.16) baseCol = vec3(1.0, 0.2, 0.2); // +X red
            if (length(p - e * xn) < 0.16) baseCol = vec3(0.6, 0.0, 0.0); // -X dark red
            if (length(p - e * yp) < 0.16) baseCol = vec3(0.2, 1.0, 0.2); // +Y green
            if (length(p - e * yn) < 0.16) baseCol = vec3(0.0, 0.5, 0.0); // -Y dark green
            if (length(p - e * zp) < 0.16) baseCol = vec3(0.2, 0.4, 1.0); // +Z blue
            if (length(p - e * zn) < 0.16) baseCol = vec3(0.0, 0.1, 0.5); // -Z dark blue
            if (length(p) < 0.21) baseCol = vec3(0.5, 0.5, 0.5); // center gray

            // Lighting
            float diff = max(dot(normal, lightDir), 0.0);
            float amb = 0.3;
            col = baseCol * (amb + diff * 0.7);
            break;
        }
        t += d;
        if (t > 10.0) break;
    }

    fragColor = vec4(col, 1.0);
}
