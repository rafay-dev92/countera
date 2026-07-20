import React, { useEffect, useState } from 'react';
import { Spinner } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { toast } from 'react-toastify';
import { State } from '@/state/Context';
import { fetchCustomers } from '@/services/fetchCustomers';
import { fetchProducts } from '@/services/fetchProducts';

export function Dashboard() {
    const { state } = State();
    const [loading, setLoading] = useState(true);
    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);

    useEffect(() => {
        Promise.allSettled([getCustomers(), getProducts()]).finally(() =>
            setLoading(false)
        );
    }, [])

    const getCustomers = async () => {
        try {
            const res = (await fetchCustomers(state.userToken))!;
            const customers = await res.json();
            if (res.status === 200) setCustomerCount(customers.length);
        } catch (error) {
            console.log((error as Error).message);
            toast.error('Something went wrong');
        }
    }

    const getProducts = async () => {
        try {
            const res = (await fetchProducts(state.userToken))!;
            const products = await res.json();
            if (res.status === 200) setProductCount(products.length);
        } catch (error) {
            console.log((error as Error).message);
            toast.error('Something went wrong');
        }
    }

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-slate-400" />
    }
    return (
        <div className="h-full w-full">
            <div className="mb-5">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-[13px] text-slate-500">Platform overview</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatisticsCard
                    title="Customers"
                    value={customerCount === null ? '—' : customerCount}
                />
                <StatisticsCard
                    title="Products"
                    value={productCount === null ? '—' : productCount}
                />
            </div>
        </div>
    );
};

export default Dashboard;
