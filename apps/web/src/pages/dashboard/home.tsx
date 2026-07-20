import React, { useEffect, useState } from 'react';
import { Spinner } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart, RemindersList, AppointmentsList } from "@/widgets/charts";
import { chartsConfig } from "@/configs";
import { toast } from 'react-toastify';
import { fetchInvoices } from '@/services/fetchInvoices';
import { State } from '@/state/Context';
import { fetchCustomers } from '@/services/fetchCustomers';
import { fetchProducts } from '@/services/fetchProducts';
import moment from 'moment-timezone';
import { fetchMonthlySales } from '@/services/fetchMontlySales';
import { fetchDailyReminders } from '@/services/fetchDailyRemiders';
import { fetchDailyAppointments } from '@/services/fetchDailyAppointments';
import type { Appointment, Invoice, Paginated, Reminder } from '@/types/api';

interface MonthlySalesData {
    months: string[];
    values: number[];
}

const money = (value: number) =>
    `$${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export function Home() {
    const { state } = State();
    const timezone = state.business?.timezone;

    const [todaysSales, setTodaysSales] = useState<number | null>(null);
    const [todaysInvoices, setTodaysInvoices] = useState<number | null>(null);
    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [monthlySales, setMonthlySales] = useState<MonthlySalesData | null>(null);
    const [chartLoading, setChartLoading] = useState(true);
    const [dailyReminders, setDailyReminders] = useState<Reminder[]>([]);
    const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);

    const showToastMessage = (type: string, message: string) => {
        if (type === 'success') toast.success(message)
        else if (type === 'info') toast.info(message)
        else toast.error(message)
    };

    const getMonthlySales = async () => {
        try {
            const res = (await fetchMonthlySales(state.userToken))!;
            const data: { months: string[]; values: (number | string)[] } = await res.json();
            if (res.status === 200) {
                setMonthlySales({
                    months: data?.months || [],
                    values: (data?.values || []).map(Number),
                });
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to load monthly sales");
        } finally {
            setChartLoading(false);
        }
    };

    const getTodaysReminders = async () => {
        try {
            const res = (await fetchDailyReminders(state.userToken, state.business!.id))!;
            const reminders: Paginated<Reminder> = await res.json();
            if (res.status === 200) {
                setDailyReminders(reminders.data || []);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to load daily reminders")
        }
    }

    const getTodaysAppointments = async () => {
        try {
            const res = (await fetchDailyAppointments(state.userToken))!;
            const appointments: Paginated<Appointment> = await res.json();
            if (res.status === 200) {
                setDailyAppointments(appointments.data || []);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to load daily appointments")
        }
    }

    const getInvoices = async () => {
        try {
            const currentDate = moment().tz(timezone!).format('YYYY-MM-DD');
            const startDate = moment.tz(currentDate, timezone!).startOf('day').utc().toDate();
            const endDate = moment.tz(currentDate, timezone!).endOf('day').utc().toDate();

            const fetchedInvoices = (await fetchInvoices(state.userToken, null as any, null as any, { paymentStatus: ['PAID', 'PARTIALLY_PAID'], startDate, endDate, isReport: true }))!;
            const totalInvoices: Paginated<Invoice> & { error?: string } = await fetchedInvoices.json();

            if (fetchedInvoices.status === 200) {
                const invoicesWithCurrentDate = totalInvoices.data.length > 0 ? totalInvoices?.data?.filter(obj => {
                    const invoiceDate = moment(obj.createdAt).tz(timezone!).format('YYYY-MM-DD');
                    return invoiceDate === currentDate;
                }) : [];
                const collected = invoicesWithCurrentDate.reduce((sum: number, invoice) => {
                    return sum + Number(invoice.paidAmount || 0);
                }, 0);
                setTodaysSales(collected);
                setTodaysInvoices(invoicesWithCurrentDate.length);
            }
            else {
                showToastMessage('error', totalInvoices.error!)
            }
        } catch (error) {
            console.log((error as Error).message);
            toast.error("Something went wrong");
        }
    };

    const getCustomers = async () => {
        try {
            const res = (await fetchCustomers(state.userToken))!;
            const customers = await res.json();
            if (res.status === 200) {
                setCustomerCount(customers.length);
            }
            else {
                showToastMessage('error', customers.error)
            }
        } catch (error) {
            console.log((error as Error).message);
            showToastMessage('error', 'Something went wrong')
        }
    }

    const getProducts = async () => {
        try {
            const res = (await fetchProducts(state.userToken))!;
            const products = await res.json();
            if (res.status === 200) {
                setProductCount(products.length);
            }
            else {
                showToastMessage('error', products.error)
            }
        } catch (error) {
            console.log((error as Error).message);
            showToastMessage('error', "Something went wrong");
        }
    }

    useEffect(() => {
        if (!state.userToken) return;
        if (timezone) {
            getInvoices();
        }
        getCustomers();
        getProducts();
    }, [timezone, state.userToken]);

    useEffect(() => {
        if (!state.userToken) return;
        getMonthlySales();
        getTodaysReminders();
        getTodaysAppointments();
    }, [state.userToken]);

    const collectionsChart: any = monthlySales && {
        type: "bar",
        height: 280,
        series: [
            {
                name: "Collected",
                data: monthlySales.values,
            },
        ],
        options: {
            ...chartsConfig,
            colors: ["#0F766E"],
            plotOptions: {
                bar: {
                    columnWidth: "45%",
                    borderRadius: 3,
                    borderRadiusApplication: "end",
                },
            },
            xaxis: {
                ...chartsConfig.xaxis,
                categories: monthlySales.months,
            },
            yaxis: {
                ...chartsConfig.yaxis,
                labels: {
                    ...chartsConfig.yaxis.labels,
                    formatter: (value: number) => { const n = Number(value); return `$${n % 1 ? n.toFixed(1) : n.toFixed(0)}k`; },
                },
            },
            tooltip: {
                ...chartsConfig.tooltip,
                y: {
                    formatter: (value: number) => `$${Math.round(Number(value) * 1000).toLocaleString()}`,
                },
            },
        },
    };

    const todayLabel = timezone
        ? moment().tz(timezone).format('dddd, MMMM D, YYYY')
        : moment().format('dddd, MMMM D, YYYY');

    return (
        <div className="h-full w-full">
            <div className="mb-5">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-[13px] text-slate-500">{todayLabel}</p>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatisticsCard
                    title="Today's sales"
                    value={todaysSales === null ? '—' : money(todaysSales)}
                    hint="Paid on invoices issued today"
                />
                <StatisticsCard
                    title="Today's invoices"
                    value={todaysInvoices === null ? '—' : todaysInvoices}
                    hint="Issued today, paid or partially paid"
                />
                <StatisticsCard
                    title="Customers"
                    value={customerCount === null ? '—' : customerCount}
                    hint="All customers"
                />
                <StatisticsCard
                    title="Products"
                    value={productCount === null ? '—' : productCount}
                    hint="Product catalog"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {chartLoading || !collectionsChart ? (
                        <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-slate-200 bg-white">
                            <Spinner className="h-6 w-6 text-slate-400" />
                        </div>
                    ) : (
                        <StatisticsChart
                            title="Collections by month"
                            description={`Amounts paid on invoices, ${new Date().getFullYear()}`}
                            chart={collectionsChart}
                        />
                    )}
                </div>
                <AppointmentsList
                    title="Today's appointments"
                    appointments={dailyAppointments}
                />
                <div className="lg:col-span-3">
                    <RemindersList
                        title="Today's reminders"
                        reminders={dailyReminders}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
