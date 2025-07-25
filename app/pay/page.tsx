'use server'
import { Suspense } from "react";
import WrappedPaymentPageContent from "@/components/pages/pay"; // HOC로 래핑된 컴포넌트
import { Loading } from "@/components/Loading";

interface PaymentData {
    to: string;
    amount: string;
    token: string;
    message: string;
    recipient: string;
    broadcastLink: string;
}

interface PaymentPageProps {
    data: { [key: string]: string | string[] | undefined };
}

interface WrappedPaymentPageContentProps {
    paymentData: PaymentData | null;
}


export default async function PaymentPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {

    const result = await searchParams
    console.log('searchParams : ', result)
    let paymentData: PaymentData | null = null;
    try {
        if (result.data && typeof result.data === "string") {
            paymentData = JSON.parse(decodeURIComponent(result.data));
            console.log('paymentData : ', paymentData)
        }
    } catch (error) {
        console.error("Error parsing payment data:", error);
    }

    return (
        <Suspense fallback={<Loading />}>
            <WrappedPaymentPageContent paymentData={paymentData} />
        </Suspense>
    );
}