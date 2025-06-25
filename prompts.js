// prompts.js
export function construirPrompt(productos, mensajeUsuario) {
  const lista = productos.map(p =>
    `📦 Producto: ${p.nombre}\n🏷 Marca: ${p.marca}\n💲 Precio: ${p.precio}\n📝 Descripción: ${p.descripcion}\n🟢 Estado: ${p.disponibilidad}`
  ).join("\n\n");

  return `El usuario preguntó: "${mensajeUsuario}"\n\nEstos son los productos disponibles:\n\n${lista}\n\nResponde de manera amable, clara y como asesor de belleza.`;
}
