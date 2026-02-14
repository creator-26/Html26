const boton = document.getElementById("boton");
const titulo = document.getElementById("titulo");
const texto = document.getElementById("texto");

boton.addEventListener("click", function () {
    titulo.style.color = "yellow";
    texto.textContent = "✅ JavaScript está funcionando correctamente!";
    console.log("El botón fue presionado");
});
