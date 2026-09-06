"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Suspense, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { SearchBar } from "./SearchBar";
import { Avatar } from "./ui";
import type { PublicUser } from "@/lib/types";

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Trade", href: "/trade" },
  { label: "Safety", href: "/safety" },
];

export interface HeaderProps {
  user: PublicUser | null;
  unreadMessages: number;
  unreadNotifications: number;
}

export function Header({ user, unreadMessages, unreadNotifications }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="tt-header">
      {/* Row 1: logo, search, utility navigation */}
      <div className="tt-container tt-header-row1">
        <Link href="/" className="tt-logo" aria-label="TeenTrade home">
          <span className="tt-logo-mark" aria-hidden="true">
            <Icon name="swap" size={18} strokeWidth={2.4} />
          </span>
          <span className="tt-logo-text">TeenTrade</span>
        </Link>

        <Suspense fallback={<div style={{ flex: 1, maxWidth: 640, height: 44 }} />}>
          <SearchBar />
        </Suspense>

        <div className="tt-header-utility">
          {user ? (
            <>
              <Link href="/messages" className="tt-icon-button" aria-label={utilityLabel("Messages", unreadMessages)}>
                <Icon name="message" size={20} />
                {unreadMessages > 0 ? (
                  <span className="tt-badge-count">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                ) : null}
              </Link>

              <Link
                href="/notifications"
                className="tt-icon-button"
                aria-label={utilityLabel("Notifications", unreadNotifications)}
              >
                <Icon name="bell" size={20} />
                {unreadNotifications > 0 ? <span className="tt-badge-dot" aria-hidden="true" /> : null}
              </Link>

              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  className="tt-avatar-button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <Avatar user={user} size={32} />
                  <span className="sr-only">Account menu for {user.username}</span>
                  <Icon name="chevron-down" size={16} />
                </button>

                {menuOpen ? (
                  <div role="menu" className="tt-menu">
                    <div className="tt-menu-head">
                      <p className="t-body-md" style={{ margin: 0 }}>@{user.username}</p>
                      <p className="t-caption" style={{ margin: 0, color: "var(--ink-muted)" }}>
                        View and manage your account
                      </p>
                    </div>
                    <Link role="menuitem" href={`/profile/${user.username}`} className="tt-menu-item">
                      <Icon name="user" size={16} /> My Profile
                    </Link>
                    <Link role="menuitem" href="/sell" className="tt-menu-item">
                      <Icon name="list" size={16} /> My Listings
                    </Link>
                    <Link role="menuitem" href="/account/saved" className="tt-menu-item">
                      <Icon name="heart" size={16} /> Saved Items
                    </Link>
                    <Link role="menuitem" href="/account/settings" className="tt-menu-item">
                      <Icon name="settings" size={16} /> Settings
                    </Link>
                    {/* Clerk owns the session, so it clears the cookie too. */}
                    <SignOutButton redirectUrl="/welcome">
                      <button role="menuitem" type="button" className="tt-menu-item tt-menu-item-danger">
                        <Icon name="log-out" size={16} /> Log Out
                      </button>
                    </SignOutButton>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-tertiary btn-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            className="tt-icon-button tt-mobile-only"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Icon name={mobileNavOpen ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Row 2: primary navigation and the always-visible List Item CTA */}
      <div className={`tt-container tt-header-row2${mobileNavOpen ? " tt-nav-open" : ""}`}>
        <nav aria-label="Primary" className="tt-primary-nav">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`tt-nav-link${isActive(item.href) ? " tt-nav-link-active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href={user ? "/sell/new" : "/login?next=/sell/new"} className="btn btn-primary btn-sm tt-list-cta">
          <Icon name="plus" size={16} />
          List Item
        </Link>
      </div>
    </header>
  );
}

function utilityLabel(base: string, count: number): string {
  if (count === 0) return base;
  return `${base}, ${count} unread`;
}
