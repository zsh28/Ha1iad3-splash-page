import React from "react";

export default function Body() {
  return (
    <div className="py-10 text-white text-lg font-light">
      {/* <h3 className="pb-10 font-roboto text-[22px] font-normal underline decoration-solid underline-offset-[3px] uppercase transition-colors duration-300">
        <a
          href="https://turbin3.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Together, we can:
        </a>
      </h3> */}

      <ul className="space-y-4">
        <li className="flex items-start justify-center">
          <span className="w-6 h-6 sm:w-8 sm:h-8 bg-[#404042] rounded-md mr-2 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="#0DCEF9"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="font-satoshi text-[16px] md:text-[22px] font-light">
            Execute critical research
          </span>
        </li>
        <li className="flex items-start justify-center">
          <span className="w-6 h-6 sm:w-8 sm:h-8 bg-[#404042] rounded-md mr-2 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="#0DCEF9"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="font-satoshi text-[16px] md:text-[22px] font-light">
            Pioneer new validator technology
          </span>
        </li>
        <li className="flex items-start justify-center">
          <span className="w-6 h-6 sm:w-8 sm:h-8 bg-[#404042] rounded-md mr-2 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="#0DCEF9"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="font-satoshi text-[16px] md:text-[22px] font-light">
            Continue to offer the best technical education in web3
          </span>
        </li>
      </ul>
    </div>
  );
}
