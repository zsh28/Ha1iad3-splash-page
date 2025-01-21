import React from "react";
import Logo from "../assets/Ha1iad3.png";

export default function Navbar() {
  return (
    <div className="max-w-[1628px] mx-auto py-14 flex flex-col px-4 items-center">
      <img src={Logo} alt="Ha1iad3 Logo" className="mb-2 w-[207px] h-auto" />
      <a
        href="https://turbin3.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-roboto text-[22px] font-normal leading-[30px] text-[#F8FAFF] uppercase underline text-center decoration-solid underline-offset-[3px]"
      >
        A Turbin3 Validator
      </a>
    </div>
  );
}
