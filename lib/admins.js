const DEFAULT = "ascendravantage@gmail.com,oziomapeter09@gmail.com";
const list = () => (process.env.ADMIN_EMAILS || DEFAULT).toLowerCase().split(/[\s,;]+/).filter(Boolean);
export const isAdmin = (email) => !!email && list().includes(String(email).toLowerCase());
