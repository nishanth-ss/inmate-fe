import Header from "../components/UI/Header";
import SideBar from "../components/UI/SideBar";
import { Outlet } from "react-router-dom";

const MainSection = ()=>{
    
    return(
        <div>
            <Header />
            <div className="flex min-h-[calc(100vh-85px)]">
                <SideBar />
                <Outlet />
            </div>
        </div>
    )
}

export default MainSection;