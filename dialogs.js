import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const dialogOptions = {
    confirmButtonColor: "#7052ef",
    cancelButtonColor: "#98a2b3",
    buttonsStyling: true,
};

export function confirmAction(text) {
    return Swal.fire({
        ...dialogOptions,
        icon: "warning",
        title: "Are you sure?",
        text,
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "Cancel",
        reverseButtons: true,
    });
}

export function showSuccess(title, text) {
    return Swal.fire({
        ...dialogOptions,
        icon: "success",
        title,
        text,
        timer: 2200,
        showConfirmButton: false,
    });
}

export function showError(text) {
    return Swal.fire({
        ...dialogOptions,
        icon: "error",
        title: "Something went wrong",
        text,
        confirmButtonText: "Close",
    });
}
