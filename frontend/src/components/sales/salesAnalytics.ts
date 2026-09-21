import type { SalesOrderItem } from "./SalesOrdersTable";

const dateParts = (value: string | Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
}).formatToParts(new Date(value));

export function salesMonth(value: string | Date = new Date()) {
  const parts = dateParts(value);
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

// Proksi sementara berdasarkan data kontak; tampilkan dasar klasifikasi di dashboard.
export function salesSegment(order: SalesOrderItem): "CORPORATE" | "CUSTOMER" {
  return order.customer?.companyName?.trim() ? "CORPORATE" : "CUSTOMER";
}

export function summarizeSales(orders: SalesOrderItem[], month: string) {
  const period = orders.filter((order) => salesMonth(order.createdAt) === month);
  const valid = period.filter((order) => order.status !== "CANCELLED");
  const total = valid.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const paid = valid.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0);
  const outstanding = valid.reduce((sum, order) => sum + Math.max(0, Number(order.totalAmount) - Number(order.paidAmount)), 0);
  const corporate = valid.filter((order) => salesSegment(order) === "CORPORATE");
  const customer = valid.filter((order) => salesSegment(order) === "CUSTOMER");
  const [year, monthNumber] = month.split("-").map(Number);
  const days = Array.from({ length: new Date(year, monthNumber, 0).getDate() }, (_, index) => ({ day: index + 1, count: 0, value: 0 }));
  valid.forEach((order) => {
    const day = Number(dateParts(order.createdAt).find((part) => part.type === "day")!.value);
    days[day - 1].count++;
    days[day - 1].value += Number(order.totalAmount);
  });
  return { period, valid, total, paid, outstanding, corporate, customer, days, cancelled: period.length - valid.length };
}
