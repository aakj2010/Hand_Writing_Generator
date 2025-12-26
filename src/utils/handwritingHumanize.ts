export const jitter = (v: number, amt = 1.2) => v + (Math.random() - 0.5) * amt;

export const randomLineWidth = () => 1.5 + Math.random() * 1.2;
