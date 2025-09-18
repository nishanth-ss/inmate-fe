import { Shield, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { usePostData } from "../../hooks/usePostData";
import LocationDialogBox from "../LocationDialogBox.jsx";
import { useEffect, useState } from "react";
import useFetchData from "@/hooks/useFetchData";

export default function Header() {

    const navigate = useNavigate()

    const { enqueueSnackbar } = useSnackbar();
    const userRole = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    const [LocationModal, setLocationModal] = useState(false)
    const [refetch, setRefetch] = useState(0);
    const { data: locations, error } = useFetchData(`location`, refetch);
    const [selectedLocation, setSelectedLocation] = useState({});

    useEffect(() => {
        if (locations?.[0]) {
            localStorage.setItem("location", JSON.stringify(locations[0]));
            setSelectedLocation(locations[0]);
        }
    }, [locations]);

    async function handleLogout() {
        const url = `user/logout`;
        const method = "post";

        const { data, error } = await usePostData(url);

        const status = error?.response?.status;

        if (error || status === 401 || status === 403) {
            enqueueSnackbar(
                data?.data?.message || "Unauthorized access. Logging out...",
                { variant: 'error' }
            );
            localStorage.removeItem('authToken');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('location');
            navigate('/login');
        } else {
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
            localStorage.removeItem('authToken')
            localStorage.removeItem('role')
            localStorage.removeItem('username')
            localStorage.removeItem('location')
            navigate('/login')
        }
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                        <Shield className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">InMate Financial System</h1>
                        <p className="text-sm text-gray-600">Administrative Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {(userRole === "ADMIN") && <div className="flex items-center">
                        {/* <div className="flex flex-col justify-center items-center"> */}
                            <div className="grid grid-cols-3 gap-2 pl-10 text-center pr-5">
                                {
                                    selectedLocation?.custodyLimits?.map((val, index) => {
                                        return <div className="border-r border-gray-400 pr-2" key={index}>
                                            <p>{val.custodyType === "remand_prisoner" ? "Remand Prison" : val.custodyType === "under_trail" ? "Under Trail" : "Contempt of Court" }</p>
                                            <div className="flex gap-3">
                                                <span>Deposit : <span className="text-green-500">{val.depositLimit}</span></span>
                                                <span>Spend : <span className="text-green-500">{val.spendLimit}</span></span>
                                            </div>
                                        </div>
                                    })
                                }
                            </div>
                        {/* </div> */}
                        <div className="flex flex-col justify-center border-r border-gray-400 pr-2">
                            <Button variant="ghost" className="cursor-pointer w-full" size="icon" onClick={() => setLocationModal(true)}>
                                <MapPin className={`w-full ${!selectedLocation?.locationName ? 'text-red-500' : 'text-green-500'}`} />
                            </Button>
                            <p>{selectedLocation?.locationName ? `${selectedLocation?.locationName}` : "No location added"}</p>
                        </div>
                    </div>}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="text-white text-sm" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{username}</p>
                            <p className="text-xs text-gray-600">{userRole}</p>
                        </div>
                        <Button variant="outline" size="sm"
                            onClick={() => {
                                handleLogout()
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
            <LocationDialogBox
                open={LocationModal}
                setOpen={setLocationModal}
                selectedLocation={locations?.[0]}
                setSelectedLocation={setSelectedLocation}
                setRefetch={setRefetch}
            />
        </header>
    );
}
