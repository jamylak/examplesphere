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

// Scene: 3 small spheres at forward difference positions + edges
float calcDist(vec3 p) {
    float e = 0.5;
    
    // 3 forward difference sample points (along +X, +Y, +Z)
    vec3 k1 = vec3(1, 0, 0);
    vec3 k2 = vec3(0, 1, 0);
    vec3 k3 = vec3(0, 0, 1);
    vec3 origin = vec3(0, 0, 0);
    
    // 3 spheres at each sample point
    float d1 = sdSphere(p - e * k1, 0.15);
    float d2 = sdSphere(p - e * k2, 0.15);
    float d3 = sdSphere(p - e * k3, 0.15);
    
    // Center sphere (sample origin)
    float center = sdSphere(p, 0.2);
    
    // 3 edges from origin to each axis point
    float edge1 = sdCapsule(p, origin, e * k1, 0.03);
    float edge2 = sdCapsule(p, origin, e * k2, 0.03);
    float edge3 = sdCapsule(p, origin, e * k3, 0.03);
    
    // Combine spheres
    float spheres = min(min(d1, d2), min(d3, center));
    
    // Combine edges
    float edges = min(edge1, min(edge2, edge3));
    
    // Combine all
    return min(spheres, edges);
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
    float angleX = iTime * -0.3 + (0.5 - mouse.x) * 6.28; // Auto + mouse
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
            
            // Color based on which sphere we hit
            vec3 baseCol = vec3(0.8, 0.3, 0.2);
            float e = 0.5;
            vec3 k1 = vec3(1, 0, 0);
            vec3 k2 = vec3(0, 1, 0);
            vec3 k3 = vec3(0, 0, 1);
            
            if (length(p - e * k1) < 0.16) baseCol = vec3(1, 0, 0); // red +X
            if (length(p - e * k2) < 0.16) baseCol = vec3(0, 1, 0); // green +Y
            if (length(p - e * k3) < 0.16) baseCol = vec3(0, 0, 1); // blue +Z
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
