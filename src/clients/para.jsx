import Para, { Environment } from "@getpara/react-sdk";

const para = new Para(Environment.BETA, process.env.VITE_PUBLIC_PARA_API_KEY);

export default para;