'use client';

import Link from 'next/link';
import { AtSignIcon, MailIcon, MessageCircleIcon, PhoneIcon, TruckIcon } from 'lucide-react';
import { useQuery } from 'convex/react';

import { t } from '@workspace/lib/i18n';
import { api } from '@workspace/convex/_generated/api';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';

export function StorefrontFooter() {
  const settings = useQuery(api.storeSettings.get);
  const year = new Date().getFullYear();

  const email = settings?.contactEmail?.trim() || 'hello@khit.example';
  const phone = settings?.contactPhone?.trim() || '+95 9 000 000 000';
  const instagram = settings?.socialInstagram?.trim();
  const facebook = settings?.socialFacebook?.trim();
  const tiktok = settings?.socialTiktok?.trim();

  return (
    <footer className="bg-muted/30 text-muted-foreground border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn
            heading={t('footer.shop')}
            links={[
              { label: t('nav.women'), href: '/women' },
              { label: t('nav.men'), href: '/men' },
              { label: t('nav.new'), href: '/new' },
              { label: t('nav.sale'), href: '/sale' },
            ]}
          />
          <FooterColumn
            heading={t('footer.about')}
            links={[
              { label: t('homepage.newsletterHeading'), href: '/#newsletter' },
              { label: t('homepage.featuredHeading'), href: '/#featured' },
            ]}
          />
          <FooterColumn
            heading={t('footer.help')}
            links={[
              { label: t('header.searchPlaceholder'), href: '#' },
              { label: t('cart.shipping'), href: '#' },
              { label: t('order.deliveryMethodShipping'), href: '#' },
            ]}
          />
          <FooterColumn
            heading={t('footer.contact')}
            links={[
              { label: email, href: `mailto:${email}`, icon: <MailIcon className="size-3.5" /> },
              { label: phone, href: phoneHref(phone), icon: <PhoneIcon className="size-3.5" /> },
            ]}
          />
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-foreground text-lg font-semibold tracking-tight">
              {t('brandName')}
            </Link>
            <p className="text-xs">
              © {year} {t('brandName')}. {t('footer.rights')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              <TruckIcon aria-hidden className="size-3.5" />
              {t('footer.paymentCod')}
            </Badge>
            {(instagram || facebook || tiktok) && (
              <div className="flex items-center gap-1">
                {instagram ? (
                  <FooterSocialLink
                    href={instagram}
                    label={t('footer.socialInstagram')}
                    icon={<AtSignIcon className="size-4" aria-hidden />}
                  />
                ) : null}
                {facebook ? (
                  <FooterSocialLink
                    href={facebook}
                    label={t('footer.socialFacebook')}
                    icon={<MessageCircleIcon className="size-4" aria-hidden />}
                  />
                ) : null}
                {tiktok ? (
                  <FooterSocialLink
                    href={tiktok}
                    label="TikTok"
                    icon={<TikTokGlyph className="size-4" aria-hidden />}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-xs">{t('header.tagline')}</p>
      </div>
    </footer>
  );
}

function phoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '#';
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.77-4.07h-3.32v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6a2.6 2.6 0 0 1 2.6-2.55c.27 0 .53.04.78.12V8.4a6 6 0 0 0-.78-.05 5.85 5.85 0 0 0-5.85 5.85 5.85 5.85 0 0 0 5.85 5.85 5.85 5.85 0 0 0 5.85-5.85V9.55a7.49 7.49 0 0 0 4.42 1.43V7.66a4.36 4.36 0 0 1-.59-1.84Z" />
    </svg>
  );
}

interface FooterColumnProps {
  heading: string;
  links: Array<{ label: string; href: string; icon?: React.ReactNode }>;
}

function FooterColumn({ heading, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-foreground text-xs font-semibold tracking-widest uppercase">{heading}</h3>
      <ul className="mt-4 flex flex-col gap-2">
        {links.map((link) => (
          <li key={`${heading}-${link.label}`}>
            <Link
              href={link.href}
              className="hover:text-foreground focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {link.icon}
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FooterSocialLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function FooterSocialLink({ href, label, icon }: FooterSocialLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="hover:bg-muted focus-visible:ring-ring/50 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {icon}
    </Link>
  );
}
