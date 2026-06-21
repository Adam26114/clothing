import Link from 'next/link';
import { AtSignIcon, MessageCircleIcon, TruckIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';

export function StorefrontFooter() {
  const year = new Date().getFullYear();
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
              { label: 'hello@khit.example', href: 'mailto:hello@khit.example' },
              { label: '+95 9 000 000 000', href: 'tel:+959000000000' },
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
            <div className="flex items-center gap-1">
              <FooterSocialLink
                href="#"
                label={t('footer.socialInstagram')}
                icon={<AtSignIcon className="size-4" aria-hidden />}
              />
              <FooterSocialLink
                href="#"
                label={t('footer.socialFacebook')}
                icon={<MessageCircleIcon className="size-4" aria-hidden />}
              />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-xs">{t('header.tagline')}</p>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  heading: string;
  links: Array<{ label: string; href: string }>;
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
              className="hover:text-foreground focus-visible:ring-ring/50 cursor-pointer text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
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
