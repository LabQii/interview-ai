import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
});

export default groq;
