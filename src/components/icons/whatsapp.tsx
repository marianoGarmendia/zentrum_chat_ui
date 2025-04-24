import { WhatsappShareButton, WhatsappIcon } from "next-share";

const WhatsappAhare = () => {
  const mensaje = encodeURIComponent(`¡Ya tengo gas natural en casa! ✅
Fue facilísimo y quiero compartirlo contigo.
Dile adiós al tanque ⛔ y pásate al gas natural con este enlace`);
  const enlaceGrupo = encodeURIComponent(
    "https://chatbots.techbank.ai/faceapp/",
  );
  const url = `https://wa.me/?text=${mensaje}%20${enlaceGrupo}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded bg-[#f7941d] px-2 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-[#e07f12]"
    >
      Compártelo en WhatsApp 👉
    </a>
  );
};

export default WhatsappAhare;
