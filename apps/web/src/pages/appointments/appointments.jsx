import React, { useEffect, useState } from 'react';
import { PencilSquareIcon, ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { format, parseISO, isSameDay } from 'date-fns';
import MyPopUpForm from './form';
import { fetchAppointments } from '@/services/fetchAppointments';
import { Card, CardHeader, CardBody, Typography, Button, Tooltip, IconButton, Spinner } from '@material-tailwind/react';
import { State } from '@/state/Context';
import { toast } from "react-toastify";
import { delAppointment } from '@/services/delAppointment';
import { useConfirm } from '@/context/confirmContext';

export function Appointments() {
    const confirm = useConfirm();
    const { state } = State();
    const [open, setOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [selected, setSelected] = useState('');
    const [monthDays, setMonthDays] = useState(0);
    const [firstDay, setFirstDay] = useState(0);
    const [loopTotal, setLoopTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const currentDate = new Date();
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);

    let weekDaysList = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

    useEffect(() => {
        if (currentMonth > 0 && currentMonth <= 12) {
            // Fix: Get number of days in the current month
            const allDays = new Date(currentYear, currentMonth, 0).getDate();

            // Fix: Get first day of month (0 = Sunday, 1 = Monday, etc.)
            const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

            setFirstDay(firstDayOfMonth);
            setSelected(monthList[currentMonth - 1] + ` ${currentYear}`);
            setMonthDays(allDays);

            // Calculate grid size needed
            if ((firstDayOfMonth + allDays) <= 35) {
                setLoopTotal(35);
            }
            else {
                setLoopTotal(42);
            }

            // Debug logging
            console.log('Calendar Debug:', {
                currentYear,
                currentMonth,
                allDays,
                firstDayOfMonth,
                totalCells: firstDayOfMonth + allDays
            });
        }
        else if (currentMonth < 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear => currentYear - 1);
        }
        else if (currentMonth > 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear => currentYear + 1);
        }
    }, [currentMonth, currentYear])

    function increNumber() {
        setCurrentMonth(currentMonth => currentMonth + 1);
    }

    function decreNumber() {
        setCurrentMonth(currentMonth => currentMonth - 1);
    }

    useEffect(() => {
        getAppointments();
    }, [refresh])

    const getAppointments = async () => {
        try {
            const res = await fetchAppointments(state.userToken);
            const appointments = await res.json();
            setAppointments(appointments);
            setLoading(false);
        } catch (error) {
            console.log(error);
            showToastMessage('error', 'Something went wrong')
        }
    }

    const handleOpen = () => {
        if (state.userInfo.Permission.some(obj => obj.name === "CAN_ADD" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
            setOpen(true);
        }
        else {
            toast.error("You are not allowed to create an appointment");
        }
    }

    const closePopup = () => {
        setOpen(false);
    };

    const handleEdit = (data) => {
        if (state.userInfo.Permission.some(obj => obj.name === "CAN_UPDATE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
            setSelectedItem(data)
            handleOpen()
        }
        else {
            toast.error("You are not allowed to update an appointment");
        }
    }

    async function handleDel(id) {
        const confirmed = await confirm("Are you sure you want to delete this appointment?");
        if (!confirmed) return
        if (state.userInfo.Permission.some(obj => obj.name === "CAN_DELETE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
            setAppointments(appointments.filter((appointment) => appointment.id !== id))
            try {
                const res = await delAppointment(id, state.userToken);
                const appointment = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', appointment.message)
                }
                else if (res.status === 404) {
                    showToastMessage('info', appointment.message)
                }
                else if (res.status === 500) {
                    showToastMessage('error', "Something went wrong");
                }
                setRefresh(!refresh)
            } catch (error) {
                console.log(error);
                showToastMessage('error', "Something went wrong");
            }
        }
        else {
            toast.error("You are not allowed to delete an appointment");
        }

    }

    const renderAppointmentsForDate = (date) => {
        const filteredAppointments = appointments?.filter((appointment) =>
            isSameDay(appointment.startDateTime, date)
        );

        return filteredAppointments?.map((appointment, index) => (
            <div key={index} className="mt-1 flex justify-center bg-blue-600 rounded-md w-[98%] h-max">
                <div className='text-white text-sm cursor-pointer px-1 py-2 w-full' onClick={() => handleEdit(appointment)}>
                    <div className='mb-1 w-min text-orange-500 font-semibold'>{format(parseISO(appointment.startDateTime), 'HH:mm')}</div>
                    <span className='p-1 my-2 rounded-sm bg-orange-400'>Customer: {appointment.customerName.split(' ')[0]}</span>
                </div>
                <XMarkIcon onClick={() => handleDel(appointment.id)} className="h-5 w-5 text-white mb-auto ml-auto cursor-pointer hover:text-red-500" />
            </div>
        ));
    };

    const isCurrentMonth = ((parseInt(monthList.indexOf(selected.split(' ')[0])) + 1 > (new Date()).getMonth() + 1) || (parseInt(selected.split(' ')[1]) > (new Date()).getFullYear()))

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
    }
    return (
        <Card className="h-full w-full ">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 sm:mb-0 flex items-center">
                    <Typography variant="h5" color="blue-gray" className="flex items-center">
                        <PencilSquareIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                        Appointments
                    </Typography>
                </div>
                <div className="flex flex-col lg:flex-row items-center w-full mt-5">
                    <div className="w-full lg:w-2/5 flex items-center justify-start gap-2">
                        <div className="flex gap-2 lg:gap-4">
                            <Button className="w-full bg-blue-900 lg:w-auto" size="md" onClick={handleOpen} >
                                New
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-4 px-0">
                <div className="">
                    <div className='flex justify-between items-end mb-2'>
                        <div className="flex items-center mx-2">
                            <h2 className="text-base lg:text-lg font-semibold text-gray-700">Calendar</h2>
                        </div>
                        <h1 className="text-base lg:text-lg font-semibold text-gray-700 uppercase">{selected}</h1>
                        <div className="flex items-center -mb-1.5">
                            <Tooltip content="Prev">
                                <IconButton disabled={!isCurrentMonth} variant="text" onClick={() => decreNumber()}>
                                    <ArrowLeftIcon className='h-6 w-6 lg:h-8 w-8 text-gray-700 cursor-pointer' />
                                </IconButton>
                            </Tooltip>

                            <Tooltip content="Next">
                                <IconButton variant="text" onClick={() => increNumber()}>
                                    <ArrowRightIcon className='h-6 w-6 lg:h-8 w-8 text-gray-700 cursor-pointer' />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                    <div className='w-full h-full overflow-x-auto overflow-y-hidden font-sans'>
                        <div className="grid grid-cols-7 min-w-[700px]">
                            {weekDaysList.map((day, index) => (
                                <span key={index} className="p-1 font-semibold border border-gray-300 h-8 text-center bg-gray-100 text-sm flex items-center justify-center">
                                    {day}
                                </span>
                            ))}
                            {Array.from({ length: loopTotal }, (_, i) => {
                                const isValidDay = i >= firstDay && i < (firstDay + monthDays);
                                const dayNumber = i - firstDay + 1;

                                return (
                                    <div key={i} className="p-1 border border-gray-300 h-28 max-h-44" >
                                        {isValidDay && (
                                            <>
                                                <span className="text-gray-700 font-medium text-sm md:text-base font-sans">{dayNumber}</span>
                                                <div className="mt-1 py-2 h-20 overflow-y-auto">
                                                    {renderAppointmentsForDate(format(new Date(currentYear, currentMonth - 1, dayNumber), 'yyyy-MM-dd'))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardBody>
            <MyPopUpForm selectedItem={selectedItem} setSelectedItem={setSelectedItem} open={open} close={closePopup} refresh={refresh} setRefresh={setRefresh} />
        </Card >
    );
};

export default Appointments;
