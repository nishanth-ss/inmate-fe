import { useState, useEffect } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

function useFetchData(url, refetch, type, totalRecords = false) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const token = localStorage.getItem('authToken')
    const one = "123"

    useEffect(() => {
        if (!url) {
            setData(null);
            return;
        }
        const fetchData = async () => {
            try {
                const query = totalRecords ? "?totalRecords=true" : "";
                const fullUrl = `${import.meta.env.VITE_API_URL}${url}${query}`;
                const response = await axios.get(fullUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setData(type == "true" ? response.data : type == "logs" ? response?.data : response.data?.data);
            } catch (err) {
                setError(err);
                if (err.status === 401 || err.status === 403) {
                    enqueueSnackbar("Token expired", {
                        variant: 'error',
                    });
                }
            }
        };

        fetchData();
    }, [url, refetch]);

    return { data, error, one };
}

export default useFetchData;
