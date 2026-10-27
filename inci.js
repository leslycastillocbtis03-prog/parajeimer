
const dialogo = document.getElementById("dialogo");
const personaje = document.getElementById("personaje");
const globo = document.getElementById("globo");
const opciones = document.getElementById("opciones");
const subtitulo = document.getElementById("subtitulo");

const mensajes = [
    {
        texto: "BIENVENIDO AMORCITO",
        imagen: "yop2.png"
    },
    {
        texto: "ESTE DIA ES MUYYY ESPECIAL AMOOOR",
        imagen: "yop2.png"
    },
    {
        texto: "Y YA SABES POR QQQ MOR 👀👀👀👀",
        imagen: "yop1.png"
    },
    {
        texto: "HOY ES NUESTRO TERCER MES ESTANDO JUNTOS MI AMOR!",
        imagen: "yopemocion.png"
    }
];

let indice = 0;

function cambiarEscena() {
    globo.classList.add("cambiando");
    personaje.classList.add("cambiando");

    setTimeout(() => {
        indice++;

        if (indice < mensajes.length) {
            dialogo.textContent = mensajes[indice].texto;
            personaje.src = mensajes[indice].imagen;
        } else {
            dialogo.textContent =
                "ASI Q TE HICE ESTE PEQUEÑO DETALLE Q ESPERO DISFRUTES AMOR... 💗LO ACEPTAS??";

            personaje.src = "yopenamorada.png";

            subtitulo.textContent = "Todo esto lo hice especialmente para ti ♡";
            opciones.hidden = false;
        }

        globo.classList.remove("cambiando");
        personaje.classList.remove("cambiando");

        if (indice < mensajes.length) {
            setTimeout(cambiarEscena, 3000);
        }
    }, 300);
}

setTimeout(cambiarEscena, 3000);
