export const sendMail = async (formData, docType) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/mail/send/${docType}`, {
            method: "POST",
            body: formData,
        });

        return res;
    } catch (error) {
        console.log(error);
    }
};