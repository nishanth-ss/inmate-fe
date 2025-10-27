import { cn } from "@/lib/utils";
import {
    Users,
    ArrowLeftRight,
    Store,
    FileText,
    LayoutDashboard,
    UserRoundPen,
    ShieldCheck,
    Upload,
    ReceiptIndianRupee,
    BellElectric,
    ShoppingBag,
    CreditCard
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png"


function SideBar() {
    const sideBarItems = [
        { title: "Dashboard", icon: LayoutDashboard, path: '/dashboard', roles: ["ADMIN"] },
        { title: "Inmate Management", icon: Users, path: '/inmate-management', roles: ["ADMIN"] },
        { title: "Financial Management", icon: ReceiptIndianRupee, path: '/financial-management', roles: ["ADMIN"] },
        { title: "Transaction History", icon: ArrowLeftRight, path: '/transaction-history', roles: ["ADMIN"] },
        { title: "Canteen POS", icon: Store, path: '/tuck-shop-pos', roles: ["ADMIN", "POS"] },
        { title: "Reports", icon: FileText, path: '/reports', roles: ["ADMIN"] },
        { title: "Bulk Operations", icon: Upload, path: '/bulk-operations', roles: ["ADMIN"] },
        { title: "Department", icon: BellElectric, path: '/department', roles: ["ADMIN"] },
        { title: "User Management", icon: UserRoundPen, path: '/user-management', roles: ["ADMIN"] },
        { title: "Inventory", icon: ShoppingBag, path: '/inventory', roles: ["ADMIN"] },
        { title: "Audit Trails", icon: ShieldCheck, path: '/audit-trails', roles: ["ADMIN"] },
        { title: "Rayzorpay Payment", icon: CreditCard, path: '/rayzorpay-payment', roles: ["ADMIN"] },
        { title: "Inmate Profile", icon: Users, path: '/inmate-profile', roles: ["INMATE"] },
        { title: "Inmate Transaction", icon: ArrowLeftRight, path: '/inmate-transaction', roles: ["INMATE"] },
    ];

    const pathName = useLocation();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role');

    const menuItems = sideBarItems?.filter((val) => val.roles.includes(userRole));

    return (
        <nav className="w-80 bg-white shadow-sm sticky top-16 overflow-y-auto">
            <div className="p-4">
                <div className="max-w-full h-[50px] flex items-center justify-center mb-2">
                    <img
                        src={Logo}
                        alt="logo"
                        className="h-full w-auto object-contain"
                    />
                </div>
                <ul className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.title} className="cursor-pointer" onClick={() => navigate(item.path)}>
                                <a
                                    className={cn(
                                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                                        pathName.pathname === item.path
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.title}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-[12px] text-gray-500 mt-2">© {new Date().getFullYear()} Allen Group. All rights reserved</p>
            </div>
        </nav>
    );
}

export default SideBar;
