"use client";

import ToastContainer from "./Toast";
import ConfirmModal from "./ConfirmModal";
import BlockNavigation from "./BlockNavigation";

export default function UIProvider() {
    return (
        <>
            <BlockNavigation />
            <ToastContainer />
            <ConfirmModal />
        </>
    );
}
