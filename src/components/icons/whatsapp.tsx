import { WhatsappShareButton, WhatsappIcon } from "next-share";

const WhatsappAhare = () => {
  const mensaje = encodeURIComponent(`Encontrá los mejores seminuevos en Zentrum`);
  const enlaceGrupo = encodeURIComponent(
    "https://www.seminuevoszentrum.cl/",
  );
  const url = `https://wa.me/?text=${mensaje}%20${enlaceGrupo}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-[#eee]  rounded px-2  text-sm font-semibold  transition-colors duration-200 hover:bg-[#e07f12]"
    >
      Compártelo<WhatsappIcon className="rounded-full h-[35px] w-[25px]"/>
    </a>
  );
};

export default WhatsappAhare;
