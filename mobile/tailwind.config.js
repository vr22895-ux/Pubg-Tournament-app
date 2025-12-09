/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bgmi: {
                    green: "#CFFF04", // Neon Green
                    orange: "#FF5E00", // Aggressive Orange
                    dark: "#0A0A0A", // Deep Black
                    card: "rgba(255, 255, 255, 0.05)", // Glass effect
                },
            },
        },
    },
    plugins: [],
}
