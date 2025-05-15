import React, { useEffect, useState } from 'react';
import { ClockIcon, HomeIcon } from '@heroicons/react/24/solid';
import {
    Typography,
    Card,
    CardHeader,
    CardBody,
    Spinner,
} from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import {
    statisticsCardsData,
    statisticsChartsData,
} from "@/data";
import { toast } from 'react-toastify';
import { fetchInvoices } from '@/services/fetchInvoices';
import { State } from '@/state/Context';
import { fetchCustomers } from '@/services/fetchCustomers';
import { fetchProducts } from '@/services/fetchProducts';
import moment from 'moment-timezone';
import { fetchMonthlySales } from '@/services/fetchMontlySales';

export function Home() {
    const { state } = State();
    const timezone = state.business.timezone;
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [cardsData, setCardsData] = useState(statisticsCardsData);
    const [chartsData, setChartsData] = useState(statisticsChartsData);

    useEffect(() => {
        setLoading(true);
        if (timezone) {
            getInvoices();
        }
        getCustomers();
        getProducts();

        setLoading(false);
    }, [timezone]);

    useEffect(() => {
        const dailySalesData = async () => {
            const res = await fetchMonthlySales(state.userToken);
            const data = await res.json();
            if (res.status === 200) {
                setChartsData(prev => {
                    return prev.map((chart, index) => {
                        if (index === 1) {
                            return {
                                ...chart,
                                chart: {
                                    ...chart.chart,
                                    series: [{
                                        ...chart.chart.series[0],
                                        data: data?.values || [],
                                    }],
                                    options: {
                                        ...chart.chart.options,
                                        xaxis: {
                                            ...chart.chart.options.xaxis,
                                            categories: data?.months || [],
                                        },
                                    },
                                },
                            };
                        }
                        return chart;
                    });
                });
            }
        };
        setChartLoading(true);
        dailySalesData();
        setTimeout(() => {
            setChartLoading(false);
        }, 1000);
    }, [state.userToken]);

    const showToastMessage = (type, message) => {
        if (type === 'success') {
            toast.success(message)
        }
        else if (type === 'info') {
            toast.info(message)
        }
        else {
            toast.error(message)
        }
    };

    const getInvoices = async () => {
        try {
            const currentDate = moment().tz(timezone).format('YYYY-MM-DD');
            const startDate = moment.tz(currentDate, timezone).startOf('day').utc().toDate();
            const endDate = moment.tz(currentDate, timezone).endOf('day').utc().toDate();

            const fetchedInvoices = await fetchInvoices(state.userToken, null, null, { paymentStatus: ['Paid', 'Partially Paid', 'Unpaid'], startDate, endDate, isReport: true });
            let totalInvoices = await fetchedInvoices.json();
            // if (state.Settings.General.invoice === 'all') {
            // }
            // else if (state.Settings.General.invoice === 'current') {
            // totalInvoices = totalInvoices?.data.filter(invoice => invoice.current === true);
            // }

            if (fetchedInvoices.status === 200) {
                const invoicesWithCurrentDate = totalInvoices?.data?.filter(obj => {
                    const invoiceDate = moment(obj.createdAt).tz(timezone).format('YYYY-MM-DD');
                    return invoiceDate === currentDate;
                });
                const money = invoicesWithCurrentDate.reduce((sum, invoice) => {
                    return sum + Number(invoice.totalAmount || 0);
                }, 0);

                const newArray = [...cardsData];

                newArray[0].value = `$${money.toFixed(2)}`;
                newArray[1].value = invoicesWithCurrentDate.length;
                setCardsData(newArray)
            }
            else {
                showToastMessage('error', totalInvoices.error)
            }

        } catch (error) {
            console.log(error.message);
            toast.error("Something went wrong");
        }
    };

    const getCustomers = async () => {
        try {
            const res = await fetchCustomers(state.userToken);
            const customers = await res.json();
            if (res.status === 200) {
                const newArray = [...cardsData];
                newArray[2].value = customers.length
                setCardsData(newArray)
            }
            else {
                showToastMessage('error', customers.error)
            }

        } catch (error) {
            console.log(error.message);
            showToastMessage('error', 'Something went wrong')
        }
    }

    const getProducts = async () => {
        try {
            const res = await fetchProducts(state.userToken);
            const products = await res.json();
            if (res.status === 200) {
                const newArray = [...cardsData];
                newArray[3].value = products.length
                setCardsData(newArray)
            }
            else {
                showToastMessage('error', products.error)
            }
        } catch (error) {
            console.log(error.message);
            showToastMessage('error', "Something went wrong");
        }
    }

    // const getAppointments = async () => {
    //     try {
    //         const res = await fetchAppointments(state.userToken);
    //         const appointments = await res.json();

    //         const appointmentsWithCurrentDate = appointments.filter(obj => obj.startDateTime.split('T')[0] === currentDate);

    //         console.log(appointmentsWithCurrentDate);
    //         const newArray = [...cardsData];
    //         newArray[2].value = appointmentsWithCurrentDate.length
    //         setCardsData(newArray)

    //     } catch (error) {
    //         console.log(error);
    //         toast.error("Something went wrong");
    //     }
    // }

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
    }
    return (
        <div className="h-full w-full">
            <div floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 sm:mb-0 flex items-center">
                    <Typography variant="h5" color="blue-gray" className="flex items-center">
                        <HomeIcon className="h-10 w-10 text-blueGray-500 ml-2 mb-4" />
                        Home
                    </Typography>
                </div>
            </div>
            <div className="p-4 px-0">
                <div className="mt-2">
                    <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
                        {cardsData.length !== 0 && (cardsData.map(({ icon, title, footer, ...rest }) => (
                            <StatisticsCard
                                key={title}
                                {...rest}
                                title={title}
                                icon={React.createElement(icon, {
                                    className: "w-6 h-6 text-white",
                                })}
                            // footer={
                            //     <Typography className="font-normal text-blue-gray-600">
                            //         <strong className={footer.color}>{footer.value}</strong>
                            //         &nbsp;{footer.label}
                            //     </Typography>
                            // }
                            />
                        )))}
                    </div>
                    {chartLoading ? <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" /> :
                        <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                            {chartsData.map((props) => (
                                <StatisticsChart
                                    key={props.title}
                                    {...props}
                                />
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default Home;
