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
import { Skeleton } from "@heroui/skeleton";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
  InfoIcon,
  UsersIcon,
  FolderKanbanIcon,
  CalendarIcon,
  PenSquareIcon,
  ImageIcon,
  HeartHandshakeIcon,
  BookOpenIcon,
  MailIcon,
  HomeIcon,
  SparklesIcon,
} from "lucide-react";

// Icon mapping for nav items
const NAV_ICONS: Record<string, React.ReactNode> = {
  "/about": <InfoIcon className="w-4 h-4" />,
  "/team": <UsersIcon className="w-4 h-4" />,
  "/projects": <FolderKanbanIcon className="w-4 h-4" />,
  "/events": <CalendarIcon className="w-4 h-4" />,
  "/blog": <PenSquareIcon className="w-4 h-4" />,
  "/gallery": <ImageIcon className="w-4 h-4" />,
  "/sponsors": <HeartHandshakeIcon className="w-4 h-4" />,
  "/docs": <BookOpenIcon className="w-4 h-4" />,
  "/resources": <BookOpenIcon className="w-4 h-4" />,
  "/contact": <MailIcon className="w-4 h-4" />,
};

// Primary links shown directly in desktop nav bar
const PRIMARY_NAV = ["/about", "/events", "/Blog", "/gallery", "/contact"];

export const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin = !loading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const primaryItems = siteConfig.navItems.filter((item) =>
    PRIMARY_NAV.includes(item.href)
  );
  const moreItems = siteConfig.navItems.filter(
    (item) => !PRIMARY_NAV.includes(item.href)
  );

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&bold=true&size=64`;

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
        base: `transition-shadow duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-xl shadow-md border-b border-divider/40"
            : "bg-background/70 backdrop-blur-lg border-b border-transparent"
        }`,
        wrapper: "px-4 sm:px-6",
      }}
    >
      {/* Left: Brand + Mobile toggle */}
      <NavbarContent justify="start" className="gap-2">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="lg:hidden text-default-600"
        />
        <NavbarBrand as="li" className="gap-2 max-w-fit">
          <NextLink className="flex items-center gap-2.5 group" href="/">
            <Logo size={32} />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent hidden sm:inline group-hover:from-purple-500 group-hover:to-pink-400 transition-all duration-300">
              Mind Mesh
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Center: Desktop nav links + More dropdown */}
      <NavbarContent justify="center" className="hidden lg:flex gap-0.5">
        {primaryItems.map((item) => (
          <NavbarItem key={item.href}>
            <NextLink
              href={item.href}
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-default-500 hover:text-foreground hover:bg-default-100/60"
              }`}
            >
              {item.label}
              {/* Animated underline indicator */}
              {isActive(item.href) && (
                <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full" />
              )}
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
                  disableRipple
                  className={`relative px-3 py-2 text-sm font-medium gap-1 min-w-0 data-[hover=true]:bg-default-100/60 ${
                    isMoreActive
                      ? "text-primary"
                      : "text-default-500 hover:text-foreground"
                  }`}
                  endContent={
                    <ChevronDownIcon className="w-3.5 h-3.5 transition-transform duration-200 group-data-[open=true]:rotate-180" />
                  }
                >
                  More
                  {isMoreActive && (
                    <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full" />
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="More navigation"
                variant="flat"
                className="w-52"
                itemClasses={{
                  base: "gap-3 py-2.5",
                }}
              >
                {moreItems.map((item) => (
                  <DropdownItem
                    key={item.href}
                    href={item.href}
                    startContent={
                      <span
                        className={
                          isActive(item.href)
                            ? "text-primary"
                            : "text-default-400"
                        }
                      >
                        {NAV_ICONS[item.href]}
                      </span>
                    }
                    className={
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : ""
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
          <NavbarItem>
            <NextLink
              href="/admin"
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                isActive("/admin")
                  ? "text-warning"
                  : "text-warning-500 hover:text-warning hover:bg-warning/10"
              }`}
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Admin
              {isActive("/admin") && (
                <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-warning rounded-full" />
              )}
            </NextLink>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Right: Theme switch + Auth */}
      <NavbarContent justify="end" className="gap-2">
        <NavbarItem className="flex">
          <ThemeSwitch />
        </NavbarItem>

        {/* Loading skeleton */}
        {loading && (
          <NavbarItem>
            <Skeleton className="w-8 h-8 rounded-full" />
          </NavbarItem>
        )}

        {!loading && (
          <>
            {user ? (
              <NavbarItem>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Avatar
                      isBordered
                      as="button"
                      className="transition-transform hover:scale-105 ring-offset-background"
                      color="primary"
                      name={user.name}
                      size="sm"
                      src={getAvatarUrl(user.name)}
                    />
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="User menu"
                    variant="flat"
                    className="w-60"
                    disabledKeys={["user-info"]}
                    itemClasses={{
                      base: "gap-3 py-2.5",
                    }}
                  >
                    <DropdownItem
                      key="user-info"
                      isReadOnly
                      className="h-auto py-3 cursor-default opacity-100"
                      textValue={user.email}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          name={user.name}
                          src={getAvatarUrl(user.name)}
                          className="shrink-0"
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-sm truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-default-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="profile"
                      href="/profile"
                      startContent={
                        <UserIcon className="w-4 h-4 text-default-500" />
                      }
                    >
                      My Profile
                    </DropdownItem>
                    <DropdownItem
                      key="tickets"
                      href="/tickets"
                      startContent={
                        <TicketIcon className="w-4 h-4 text-default-500" />
                      }
                    >
                      My Tickets
                    </DropdownItem>
                    <DropdownItem
                      key="settings"
                      href="/settings"
                      startContent={
                        <SettingsIcon className="w-4 h-4 text-default-500" />
                      }
                    >
                      Settings
                    </DropdownItem>
                    <DropdownItem
                      key="admin"
                      href="/admin"
                      startContent={
                        <ShieldIcon className="w-4 h-4 text-warning" />
                      }
                      className={isAdmin ? "text-warning" : "hidden"}
                      color="warning"
                    >
                      Admin Dashboard
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      className="text-danger"
                      startContent={<LogOutIcon className="w-4 h-4" />}
                      onPress={handleLogout}
                    >
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            ) : (
              <>
                <NavbarItem className="hidden sm:flex">
                  <Button
                    as={NextLink}
                    href="/login"
                    variant="light"
                    size="sm"
                    className="font-medium text-default-600 hover:text-foreground"
                  >
                    Login
                  </Button>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                  <Button
                    as={NextLink}
                    href="/register"
                    size="sm"
                    className="font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:opacity-90 transition-all duration-200"
                  >
                    Sign Up
                  </Button>
                </NavbarItem>
                {/* Small screen: single login button */}
                <NavbarItem className="flex sm:hidden">
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
              </>
            )}
          </>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu className="pt-6 pb-8 bg-background/95 backdrop-blur-xl gap-0">
        {/* User info at top of mobile menu */}
        {user && (
          <>
            <div className="flex items-center gap-3 px-4 pb-4">
              <Avatar
                size="md"
                name={user.name}
                src={getAvatarUrl(user.name)}
                isBordered
                color="primary"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-base truncate">
                  {user.name}
                </span>
                <span className="text-xs text-default-400 truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <Divider className="mb-3" />
          </>
        )}

        {/* Navigation section */}
        <div className="px-2">
          <p className="text-[11px] uppercase font-bold text-default-400 tracking-wider px-3 mb-2">
            Navigate
          </p>
          <div className="flex flex-col gap-0.5">
            {siteConfig.navItems.map((item) => (
              <NavbarMenuItem key={item.href}>
                <NextLink
                  href={item.href}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-default-600 hover:text-foreground hover:bg-default-100 active:scale-[0.98]"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span
                    className={
                      isActive(item.href)
                        ? "text-primary"
                        : "text-default-400"
                    }
                  >
                    {NAV_ICONS[item.href] || (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                  </span>
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </NextLink>
              </NavbarMenuItem>
            ))}
          </div>
        </div>

        {/* Account section for logged-in users */}
        {user && (
          <>
            <Divider className="my-3" />
            <div className="px-2">
              <p className="text-[11px] uppercase font-bold text-default-400 tracking-wider px-3 mb-2">
                Account
              </p>
              <div className="flex flex-col gap-0.5">
                <NavbarMenuItem>
                  <NextLink
                    href="/profile"
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                      isActive("/profile")
                        ? "text-primary bg-primary/10"
                        : "text-default-600 hover:text-foreground hover:bg-default-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 text-default-400" />
                    My Profile
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <NextLink
                    href="/tickets"
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                      isActive("/tickets")
                        ? "text-primary bg-primary/10"
                        : "text-default-600 hover:text-foreground hover:bg-default-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TicketIcon className="w-4 h-4 text-default-400" />
                    My Tickets
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <NextLink
                    href="/settings"
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                      isActive("/settings")
                        ? "text-primary bg-primary/10"
                        : "text-default-600 hover:text-foreground hover:bg-default-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <SettingsIcon className="w-4 h-4 text-default-400" />
                    Settings
                  </NextLink>
                </NavbarMenuItem>
              </div>
            </div>
          </>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <Divider className="my-3" />
            <div className="px-2">
              <p className="text-[11px] uppercase font-bold text-warning-500 tracking-wider px-3 mb-2">
                Admin
              </p>
              <NavbarMenuItem>
                <NextLink
                  href="/admin"
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
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
            </div>
          </>
        )}

        {/* Logout for logged-in users */}
        {user && (
          <>
            <Divider className="my-3" />
            <div className="px-4">
              <Button
                fullWidth
                variant="flat"
                color="danger"
                startContent={<LogOutIcon className="w-4 h-4" />}
                className="font-medium"
                onPress={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                Log Out
              </Button>
            </div>
          </>
        )}

        {/* Auth buttons for non-logged-in users */}
        {!loading && !user && (
          <>
            <Divider className="my-4" />
            <div className="flex flex-col gap-2.5 px-4">
              <Button
                as={NextLink}
                href="/register"
                className="w-full font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/20"
                size="lg"
                onPress={() => setIsMenuOpen(false)}
              >
                Get Started
              </Button>
              <Button
                as={NextLink}
                href="/login"
                variant="bordered"
                className="w-full font-medium"
                size="lg"
                onPress={() => setIsMenuOpen(false)}
              >
                Login
              </Button>
            </div>
          </>
        )}
      </NavbarMenu>
    </HeroUINavbar>
  );
};