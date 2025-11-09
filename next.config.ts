import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  // Your existing Next.js config
};

export default withPWA({
  dest: "public",
})(nextConfig);
