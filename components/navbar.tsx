// components/navbar.tsx
"use client";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  ShieldIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  TicketIcon,
  ChevronDownIcon,
  MenuIcon,
} from "lucide-react";

// Split nav items: primary shown directly, rest go in "More" dropdown
const PRIMARY_NAV = ["/about", "/events", "/blog", "/gallery", "/contact"];

export const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = !loading && user && isUserAdminByEmail(user.email);

  const primaryItems = siteConfig.navItems.filter((item) =>
    PRIMARY_NAV.includes(item.href)
  );
  const moreItems = siteConfig.navItems.filter(
    (item) => !PRIMARY_NAV.includes(item.href)
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=64`;
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      classNames={{
        base: "bg-background/80 backdrop-blur-lg border-b border-divider/50",
        wrapper: "px-4 sm:px-6",
      }}
    >
      {/* Left: Brand + Mobile toggle */}
      <NavbarContent justify="start" className="gap-2">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="lg:hidden"
        />
        <NavbarBrand as="li" className="gap-2 max-w-fit">
          <NextLink className="flex items-center gap-2" href="/">
            <Logo size={32} />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent hidden sm:inline">
              Mind Mesh
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Center: Desktop nav links + More dropdown */}
      <NavbarContent justify="center" className="hidden lg:flex gap-1">
        {primaryItems.map((item) => (
          <NavbarItem key={item.href} isActive={isActive(item.href)}>
            <NextLink
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-default-600 hover:text-foreground hover:bg-default-100"
              }`}
            >
              {item.label}
            </NextLink>
          </NavbarItem>
        ))}

        {/* "More" dropdown for remaining nav items */}
        {moreItems.length > 0 && (
          <NavbarItem>
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <Button
                  variant="light"
                  size="sm"
                  className={`px-3 py-2 text-sm font-medium gap-1 ${
                    isMoreActive
                      ? "text-primary bg-primary/10"
                      : "text-default-600 hover:text-foreground"
                  }`}
                  endContent={<ChevronDownIcon className="w-3.5 h-3.5" />}
                >
                  More
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="More navigation"
                variant="flat"
                className="w-48"
              >
                {moreItems.map((item) => (
                  <DropdownItem
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(item.href) ? "text-primary bg-primary/10" : ""
                    }
                  >
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        )}

        {isAdmin && (
          <NavbarItem isActive={isActive("/admin")}>
            <NextLink
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                isActive("/admin")
                  ? "text-warning bg-warning/10"
                  : "text-warning-600 hover:text-warning hover:bg-warning/10"
              }`}
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Admin
            </NextLink>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Right: Theme switch + Auth */}
      <NavbarContent justify="end" className="gap-2">
        <NavbarItem className="flex">
          <ThemeSwitch />
        </NavbarItem>

        {!loading && (
          <>
            {user ? (
              <NavbarItem>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Avatar
                      isBordered
                      as="button"
                      className="transition-transform hover:scale-105"
                      color="primary"
                      name={user.name}
                      size="sm"
                      src={getAvatarUrl(user.name)}
                    />
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="User menu"
                    variant="flat"
                    className="w-56"
                    disabledKeys={["user-info"]}
                  >
                    <DropdownItem
                      key="user-info"
                      isReadOnly
                      className="h-auto py-3 cursor-default"
                      textValue={user.email}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user.name}</span>
                        <span className="text-xs text-default-500">{user.email}</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="profile"
                      href="/profile"
                      startContent={<UserIcon className="w-4 h-4 text-default-500" />}
                    >
                      My Profile
                    </DropdownItem>
                    <DropdownItem
                      key="tickets"
                      href="/tickets"
                      startContent={<TicketIcon className="w-4 h-4 text-default-500" />}
                    >
                      My Tickets
                    </DropdownItem>
                    <DropdownItem
                      key="settings"
                      href="/settings"
                      startContent={<SettingsIcon className="w-4 h-4 text-default-500" />}
                    >
                      Settings
                    </DropdownItem>
                    <DropdownItem
                      key="admin"
                      href="/admin"
                      startContent={<ShieldIcon className="w-4 h-4 text-warning" />}
                      className={isAdmin ? "text-warning" : "hidden"}
                      color="warning"
                    >
                      Admin Dashboard
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={<LogOutIcon className="w-4 h-4" />}
                      onPress={handleLogout}
                    >
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            ) : (
              <NavbarItem>
                <Button
                  as={NextLink}
                  href="/login"
                  color="primary"
                  variant="flat"
                  size="sm"
                  className="font-medium"
                >
                  Login
                </Button>
              </NavbarItem>
            )}
          </>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu className="pt-4 pb-6 bg-background/95 backdrop-blur-lg">
        <div className="flex flex-col gap-1">
          {siteConfig.navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink
                href={item.href}
                className={`block w-full px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-default-600 hover:text-foreground hover:bg-default-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}

          {isAdmin && (
            <>
              <Divider className="my-2" />
              <NavbarMenuItem>
                <NextLink
                  href="/admin"
                  className={`w-full px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 ${
                    isActive("/admin")
                      ? "text-warning bg-warning/10"
                      : "text-warning-600 hover:text-warning hover:bg-warning/10"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldIcon className="w-4 h-4" />
                  Admin Dashboard
                </NextLink>
              </NavbarMenuItem>
            </>
          )}
        </div>

        {!loading && !user && (
          <>
            <Divider className="my-3" />
            <div className="flex flex-col gap-2 px-4">
              <Button
                as={NextLink}
                href="/login"
                color="primary"
                variant="flat"
                className="w-full font-medium"
                onPress={() => setIsMenuOpen(false)}
              >
                Login
              </Button>
              <Button
                as={NextLink}
                href="/register"
                color="primary"
                className="w-full font-medium"
                onPress={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Button>
            </div>
          </>
        )}
      </NavbarMenu>
    </HeroUINavbar>
  );
};