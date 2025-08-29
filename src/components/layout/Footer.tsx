import Link from "next/link";
import { Github, Twitter, MessageCircle, ExternalLink, Shield, Zap, Users, BarChart3 } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Token Market", href: "/tokens" },
    { name: "Create Token", href: "/create" },
    { name: "Featured Projects", href: "/#featured" },
    { name: "Latest Launches", href: "/#latest" },
  ],
  resources: [
    { name: "API Documentation", href: "/api/docs" },
    { name: "Developer Guide", href: "/docs" },
    { name: "Smart Contracts", href: "/contracts" },
    { name: "Security Audit", href: "/security" },
  ],
  community: [
    { name: "Discord", href: "https://discord.gg/boboom", icon: MessageCircle },
    { name: "Twitter", href: "https://twitter.com/boboom", icon: Twitter },
    { name: "Telegram", href: "https://t.me/boboom", icon: MessageCircle },
    { name: "GitHub", href: "https://github.com/boboom", icon: Github },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "Status Page", href: "/status" },
    { name: "Feedback", href: "/feedback" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background/95 to-background/98 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8 py-12">
          {/* Brand Section */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-start">
              <div className="relative h-12 w-40 sm:h-15 sm:w-48">
                <img src="/logo_white.png" alt="BoBoom" className="h-full w-full object-contain" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Next-generation meme coin launchpad. Create, trade, and incubate innovative blockchain projects.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                <Shield className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Security Audited</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Quick Deployment</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Resources
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <MessageCircle className="h-4 w-4 mr-2 text-primary" />
              Community
            </h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-muted-foreground/70 hover:text-foreground transition-all duration-200 hover:translate-x-1 group"
                  >
                    <link.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{link.name}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary" />
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block whitespace-nowrap"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>



        {/* Bottom Bar */}
        <div className="border-t border-border/40 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} BoBoom. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground/70">
              <Link href="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors whitespace-nowrap">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


