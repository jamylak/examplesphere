# 🌐 Example Sphere



https://github.com/user-attachments/assets/f1ab9757-5688-4980-878d-81b24b54978c



A tiny GLSL sphere shader

It raymarches a sphere, warps the surface with animated 3D noise, and shades it using the surface normal, which gives it that shifting false-color / topology-map look.

## ✨ What It Does

- Renders a procedural sphere from `sphere.frag`
- Uses `iTime` to animate the surface distortion
- Visualizes normals directly for a bold neon look
- Runs through `vsdf`'s ShaderToy-style wrapper with hot reload while you edit

## 🚀 Run It

```sh
vsdf --toy sphere.frag
```

## 🛠️ Install `vsdf`

On macOS, the upstream `vsdf` README currently recommends:

```sh
brew install jamylak/vsdf/vsdf
```

For full installation notes, install instructions on other platforms, and source builds, see:

- [`jamylak/vsdf`](https://github.com/jamylak/vsdf)
