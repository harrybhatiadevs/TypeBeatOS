"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./public-nav.css";

export type PublicNavItem = {
  href: string;
  label: string;
  sectionId?: string;
  testId?: string;
};

export type PublicNavAction = {
  href: string;
  label: string;
  tone?: "ghost" | "primary";
  testId?: string;
};

export default function PublicNav({
  links = [],
  action,
  homeHref = "/",
  testId,
  trackSections = false,
}: {
  links?: PublicNavItem[];
  action: PublicNavAction;
  homeHref?: string;
  testId?: string;
  trackSections?: boolean;
}) {
  const navRef = useRef<HTMLElement>(null);
  const firstSection = links.find((link) => link.sectionId)?.sectionId ?? "";
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(firstSection);

  useEffect(() => {
    const sections = trackSections
      ? links
          .filter((link): link is PublicNavItem & { sectionId: string } =>
            Boolean(link.sectionId),
          )
          .map((link) => ({
            id: link.sectionId,
            element: document.getElementById(link.sectionId),
          }))
          .filter(
            (
              section,
            ): section is { id: string; element: HTMLElement } =>
              Boolean(section.element),
          )
      : [];

    const update = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setScrolled(scrollY > 12);

      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      navRef.current?.style.setProperty(
        "--public-nav-progress",
        String(Math.min(1, Math.max(0, scrollY / max))),
      );

      if (sections.length > 0) {
        let current = sections[0];
        for (const section of sections) {
          if (section.element.getBoundingClientRect().top <= 120) {
            current = section;
          }
        }
        setActiveSection(current.id);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [links, trackSections]);

  return (
    <nav
      ref={navRef}
      className={`public-nav${scrolled ? " is-scrolled" : ""}`}
      data-testid={testId}
    >
      <div className="public-nav-inner">
        <Link
          href={homeHref}
          className="public-nav-brand"
          aria-label="TypeBeatOS home"
        >
          <span className="public-nav-wordmark">
            TYPEBEAT<span>OS</span>
          </span>
        </Link>

        {links.length > 0 && (
          <div className="public-nav-links">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`public-nav-link${
                  link.sectionId && activeSection === link.sectionId
                    ? " is-active"
                    : ""
                }`}
                data-testid={link.testId}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <Link
          href={action.href}
          className={`public-nav-action public-nav-action-${
            action.tone ?? "ghost"
          }`}
          data-testid={action.testId}
        >
          {action.label}
        </Link>
      </div>
      {trackSections && (
        <span className="public-nav-progress" aria-hidden="true" />
      )}
    </nav>
  );
}
