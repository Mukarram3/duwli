import { useState, Suspense, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allSettingsItems } from '@/utils/settings';
import { getSettingsComponent } from '@/utils/settings-components';
import { Search } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { auth, globalSettings = {}, emailProviders = {}, cacheSize = '0.00' } = usePage().props as any;
  const [activeSection, setActiveSection] = useState('brand-settings');
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarNavItems = allSettingsItems();

  const filteredItems = useMemo(() => {
    return sidebarNavItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sidebarNavItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups = [
      { id: 'core', label: t('Core Configuration'), min: 0, max: 400 },
      { id: 'integrations', label: t('Integrations & Chat'), min: 400, max: 1000 },
      { id: 'billing', label: t('Payments & Billing'), min: 1000, max: 99999 },
    ];

    return groups.map(group => {
      const items = filteredItems.filter(item => (item.order || 999) >= group.min && (item.order || 999) < group.max);
      return {
        ...group,
        items
      };
    }).filter(group => group.items.length > 0);
  }, [filteredItems, t]);

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = filteredItems.map(item => item.href.replace('#', ''));

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredItems]);

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: t('Settings') }]}
      pageTitle={t('Settings')}
    >
      <Head title={t('Settings')} />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-4 bg-card border border-border/80 shadow-sm rounded-xl p-3 z-20">
            {/* Search Settings */}
            <div className="relative mb-3.5">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder={t('Search settings...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ltr:pl-9 ltr:pr-8 rtl:pr-9 rtl:pl-8 py-2 text-sm bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-lg outline-none transition-all duration-200 text-foreground placeholder-muted-foreground/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute ltr:right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-hover-only pr-1">
              <div className="space-y-4">
                {groupedItems.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <div className="pt-4 pb-1.5 first:pt-0">
                      <span className="text-[14px] font-semibold tracking-wider text-muted-foreground/70 px-3.5 block">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.href.replace('#', '');

                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ltr:text-left rtl:text-right outline-none ltr:border-l-[3px] rtl:border-r-[3px] ltr:border-r-0 rtl:border-l-0 rounded-lg",
                            isActive
                              ? "bg-primary/10 text-primary border-primary ltr:rounded-r-lg ltr:rounded-l-none rtl:rounded-l-lg rtl:rounded-r-none"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", {
                            "scale-110 text-primary": isActive
                          })} />
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {groupedItems.length === 0 && (
                  <div className="py-8 px-4 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">{t('No settings found')}</p>
                    <p className="text-[10px] opacity-70 mt-1">{t('Try adjusting your query')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="pr-4">
              {filteredItems.map((item) => {
                const sectionId = item.href.replace('#', '');
                const canManage = auth.user?.permissions?.includes(item.permission);

                if (!canManage) return null;

                const Component = getSettingsComponent(item.component);
                if (!Component) return null;

                return (
                  <section key={sectionId} id={sectionId} className="mb-8">
                    <Suspense fallback={<div className="p-4">Loading...</div>}>
                      <Component
                        userSettings={globalSettings}
                        auth={auth}
                        emailProviders={emailProviders}
                        cacheSize={cacheSize}
                      />
                    </Suspense>
                  </section>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="py-20 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <h3 className="text-lg font-bold">{t('No Settings Found')}</h3>
                  <p className="text-sm opacity-70 mt-1">{t('We couldn\'t find any settings matching "{{query}}"', { query: searchQuery })}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
