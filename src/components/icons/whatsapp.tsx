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
      className="flex items-center gap-2 bg-[#e57200] text-[#eee] rounded px-2  text-sm font-semibold  transition-colors duration-200 hover:bg-[#e07f12]"
    >
      Compártelo<WhatsappIcon className="rounded-full h-[35px] w-[25px]"/>
    </a>
  );
};

export default WhatsappAhare;
