import { Head, router, usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, Search, CreditCard, Plus, Minus, Trash2, X, Home, Printer, FileText, Image, Package, Barcode, ChevronLeft, ChevronRight, Loader2, Dumbbell, Coffee, Wrench, Cpu, Gem, Apple, BookOpen, Leaf, Heart } from 'lucide-react';
import { getImagePath, formatCurrency,formatDate } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { useFormFields } from '@/hooks/useFormFields';
import { BrandProvider } from '@/contexts/brand-context';
import ReceiptModal from './ReceiptModal';

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface WarehouseType {
    id: number;
    name: string;
    address: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category?: string;
    image?: string;
    taxes?: Array<{
        id: number;
        name: string;
        rate: number;
    }>;
}

interface CartItem extends Product {
    quantity: number;
}

interface CreateProps {
    customers: Customer[];
    warehouses: WarehouseType[];
    categories: Category[];
}

function CreateContent({ customers = [], warehouses = [], categories = [] }: CreateProps) {
    const { t } = useTranslation();
    const { adminAllSetting, companyAllSetting, auth } = usePage().props as any;
    useFavicon();

    const isSuperAdmin = auth?.user?.roles?.includes('superadmin');
    const globalSettings = isSuperAdmin ? adminAllSetting : companyAllSetting;

    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
        const saved = sessionStorage.getItem('pos_selected_warehouse');
        return saved || (warehouses.length > 0 ? warehouses[0].id.toString() : '');
    });
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [skuInput, setSkuInput] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [loadingMore, setLoadingMore] = useState(false);
    const categoryContainerRef = useRef<HTMLDivElement>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setVisibleCount(20);
    }, [products]);

    const handleLoadMore = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => prev + 20);
            setLoadingMore(false);
        }, 600);
    };

    const scrollCategories = (direction: 'left' | 'right') => {
        if (categoryContainerRef.current) {
            const scrollAmount = 200;
            categoryContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const fetchProducts = () => {
        if (selectedWarehouse) {
            setLoading(true);
            const params = new URLSearchParams({ warehouse_id: selectedWarehouse });
            if (selectedCategory && selectedCategory !== 'all') {
                params.append('category_id', selectedCategory);
            }
            fetch(`${route('pos.products')}?${params}`)
                .then(response => response.json())
                .then(data => setProducts(data))
                .catch(error => console.error('Error:', error))
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [selectedWarehouse, selectedCategory]);

    // Clear cart only when warehouse changes
    useEffect(() => {
        setCart([]);
    }, [selectedWarehouse]);

    const handleSkuInput = (value: string) => {
        setSkuInput(value);
        if (value.trim() && selectedWarehouse) {
            const matchedProduct = products.find(product =>
                product.sku === value
            );
            if (matchedProduct) {
                addToCart(matchedProduct);
                setSkuInput('');
            }
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
            setCart(prev => prev.filter(item => item.id !== id));
        } else {
            setCart(prev => prev.map(item =>
                item.id === id ? { ...item, quantity } : item
            ));
        }
    };

    const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const getTaxAmount = () => {
        let totalTax = 0;
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            if (item.taxes && item.taxes.length > 0) {
                item.taxes.forEach(tax => {
                    totalTax += (itemSubtotal * tax.rate) / 100;
                });
            }
        });
        return totalTax;
    };

    const getTaxBreakdown = () => {
        const taxBreakdown: { [key: string]: { name: string; amount: number } } = {};
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            if (item.taxes && item.taxes.length > 0) {
                item.taxes.forEach(tax => {
                    const taxAmount = (itemSubtotal * tax.rate) / 100;
                    const taxKey = `${tax.name}_${tax.rate}`;
                    if (taxBreakdown[taxKey]) {
                        taxBreakdown[taxKey].amount += taxAmount;
                    } else {
                        taxBreakdown[taxKey] = {
                            name: `${tax.name} (${tax.rate}%)`,
                            amount: taxAmount
                        };
                    }
                });
            }
        });
        return Object.values(taxBreakdown);
    };
    const getTotal = () => getSubtotal() + getTaxAmount() - discountAmount;

    const [discountAmount, setDiscountAmount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const [paidAmount, setPaidAmount] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [nextPosNumber, setNextPosNumber] = useState('');
    const [data, setData] = useState(() => {
        const savedBankAccount = sessionStorage.getItem('pos_selected_bank_account');
        return {
            bank_account_id: savedBankAccount || ''
        };
    });
    const [errors, setErrors] = useState<any>({});

    // Custom setData function to persist bank account selection
    const handleSetData = (key: string, value: any) => {
        if (key === 'bank_account_id') {
            sessionStorage.setItem('pos_selected_bank_account', value);
            setErrors((prev: any) => ({ ...prev, bank_account_id: '' }));
        }
        setData(prev => ({ ...prev, [key]: value }));
    };

    const bankAccountField = useFormFields('bankAccountField', data, handleSetData, errors);

    useEffect(() => {
        // Fetch next POS number from backend
        fetch(route('pos.pos-number'))
            .then(response => response.json())
            .then(data => setNextPosNumber(data.pos_number))
            .catch(error => {
                // Fallback to generated number
                const randomCount = Math.floor(Math.random() * 100) + 1;
                setNextPosNumber('#POS' + String(randomCount).padStart(5, '0'));
            });
    }, []);

    useEffect(() => {
        const savedBankAccount = sessionStorage.getItem('pos_selected_bank_account');
        if (!savedBankAccount) {
            fetch(route('account.bank-accounts.api.list'))
                .then(response => response.json())
                .then(accounts => {
                    if (accounts && accounts.length > 0) {
                        handleSetData('bank_account_id', accounts[0].id.toString());
                    }
                })
                .catch(error => console.error('Error fetching default bank account:', error));
        }
    }, []);

    const handlePayment = () => {
        // Get fresh POS number before processing
        fetch(route('pos.pos-number'))
            .then(response => response.json())
            .then(data => {
                const freshPosNumber = data.pos_number;
                setNextPosNumber(freshPosNumber);

                // Get current bank account ID from sessionStorage as backup
                const currentBankAccountId = data.bank_account_id || sessionStorage.getItem('pos_selected_bank_account');

                 const formData = {
                    customer_id: (selectedCustomer && selectedCustomer !== '0') ? selectedCustomer : null,
                    warehouse_id: selectedWarehouse,
                    bank_account_id: currentBankAccountId || null,
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    discount: discountAmount,
                    tax_amount: getTaxAmount(),
                    payment_method: paymentMethod,
                    paid_amount: parseFloat(paidAmount || '0'),
                    pos_number: freshPosNumber
                };

                setProcessing(true);

                router.post(route('pos.store'), formData, {
            onSuccess: (response: any) => {
                setProcessing(false);
                setCompletedSale({
                    pos_number: response.props?.pos_number || nextPosNumber,
                    items: cart,
                    subtotal: getSubtotal(),
                    tax: getTaxAmount(),
                    discount: discountAmount,
                    total: getTotal(),
                    customer: (selectedCustomer && selectedCustomer !== '0') ? customers.find(c => c.id.toString() === selectedCustomer) : null,
                    warehouse: warehouses.find(w => w.id.toString() === selectedWarehouse),
                    payment_method: paymentMethod,
                    paid_amount: parseFloat(paidAmount || '0')
                });
                // Close payment modal first, then show receipt
                setShowPaymentModal(false);
                setTimeout(() => {
                    setShowReceiptModal(true);
                }, 100);
            },
            onError: (errors) => {
                setProcessing(false);
                console.error('Payment failed:', errors);
            },
                    preserveState: true,
                    preserveScroll: true
                });
            })
            .catch(error => {
                console.error('Error fetching fresh POS number:', error);
                setProcessing(false);
            });
    };

    const handlePaymentComplete = () => {
        setShowReceiptModal(false);
        setCart([]);
        setSelectedCustomer('');
        setDiscountAmount(0);
        setCompletedSale(null);
        // Refresh POS number for next transaction
        fetch(route('pos.pos-number'))
.then(response => response.json())
            .then(data => setNextPosNumber(data.pos_number))
            .catch(error => console.error('Error fetching new POS number:', error));
        // Refresh products to reflect decreased stock quantities
        fetchProducts();
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedProducts = filteredProducts.slice(0, visibleCount);

    const getCategoryVisuals = (name: string, index: number) => {
        const lower = name.toLowerCase();
        let icon = <Package className="h-5 w-5" />;
        if (lower.includes('all')) icon = <ShoppingCart className="h-5 w-5" />;
        else if (lower.includes('sport') || lower.includes('fit') || lower.includes('gym')) icon = <Dumbbell className="h-5 w-5" />;
        else if (lower.includes('food') || lower.includes('bev') || lower.includes('eat') || lower.includes('drink')) icon = <Coffee className="h-5 w-5" />;
        else if (lower.includes('auto') || lower.includes('tool') || lower.includes('car') || lower.includes('wrench')) icon = <Wrench className="h-5 w-5" />;
        else if (lower.includes('electr') || lower.includes('tech') || lower.includes('phone') || lower.includes('comp')) icon = <Cpu className="h-5 w-5" />;
        else if (lower.includes('jewel') || lower.includes('ring') || lower.includes('access')) icon = <Gem className="h-5 w-5" />;
        else if (lower.includes('fruit') || lower.includes('veg') || lower.includes('fresh')) icon = <Apple className="h-5 w-5" />;
        else if (lower.includes('book') || lower.includes('read') || lower.includes('station') || lower.includes('paper')) icon = <BookOpen className="h-5 w-5" />;
        else if (lower.includes('home') || lower.includes('gard') || lower.includes('plant') || lower.includes('decor')) icon = <Leaf className="h-5 w-5" />;
        else if (lower.includes('health') || lower.includes('beaut') || lower.includes('care') || lower.includes('cosm')) icon = <Heart className="h-5 w-5" />;
        
        const bgColors = [
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            'bg-orange-500/10 text-orange-600 dark:text-orange-400'
        ];
        const color = bgColors[index % bgColors.length];
        return { icon, color };
    };

    return (
        <>
            <Head title={t('POS')} />

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}</style>

            <div className="lg:h-[calc(100vh-30px)] lg:overflow-hidden bg-[#f8fafc] dark:bg-zinc-955 flex flex-col text-slate-900 dark:text-zinc-100 transition-colors duration-200 font-sans">
                {/* POS Page Header / Breadcrumbs */}
                <div className="px-4 sm:px-6 pt-3 pb-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-455 font-medium">
                            <Link href={route('pos.index')} className="hover:text-emerald-600 transition-colors">{t('Dashboard')}</Link>
                            <span>/</span>
                            <span className="text-slate-800 dark:text-zinc-300 font-bold">{t('POS')}</span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-zinc-5 mt-1">{t('POS - Point of Sale')}</h1>
                        <p className="text-xs text-slate-505 dark:text-zinc-455 mt-0.5">{t('Manage your business sales transactions with comprehensive POS system.')}</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-2.5 sm:p-3 gap-3 min-h-0">
                    {/* Products Section Card */}
                    <Card className="flex-1 flex flex-col min-w-0 order-2 lg:order-1 bg-white dark:bg-zinc-900 border-slate-150/60 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-4 flex flex-col h-full overflow-hidden">
                            {/* Point of Sale Header with Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800/60 flex-shrink-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center justify-center h-9 w-9 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-150">{t('Point of Sale')}</h2>
                                </div>
                                <div>
                                    <Link href={route('pos.index')}>
                                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-300 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 rounded-lg gap-1.5 transition-colors">
                                            <Home className="h-3.5 w-3.5" />
                                            
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 flex-shrink-0">
                                {/* Search Input */}
                                <div className="relative md:col-span-5">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-zinc-550" />
                                    <Input
                                        placeholder={t('Search products by name or SKU...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-10 border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl"
                                    />
                                </div>

                                {/* Warehouse Select */}
                                <div className="md:col-span-4">
                                    <Select value={selectedWarehouse} onValueChange={(value) => {
                                        setSelectedWarehouse(value);
                                        sessionStorage.setItem('pos_selected_warehouse', value);
                                    }}>
                                        <SelectTrigger className="h-10 border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 rounded-xl text-slate-700 dark:text-zinc-300">
                                            <SelectValue placeholder={t('Select Warehouse')} />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                            {warehouses.map(warehouse => (
                                                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Barcode/SKU scan Input */}
                                <div className="relative md:col-span-3">
                                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-zinc-550" />
                                    <Input
                                        placeholder={t('Add To Cart by SKU')}
                                        className="pl-10 h-10 border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl"
                                        value={skuInput}
                                        onChange={(e) => handleSkuInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Category Filter Slider with Navigation Chevrons */}
                            <div className="relative flex items-center mt-4 flex-shrink-0 group">
                                {categories.length > 4 && (
                                    <button
                                        type="button"
                                        onClick={() => scrollCategories('left')}
                                        className="absolute -left-2 top-1/2 -translate-y-[60%] z-20 h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all dark:hover:bg-zinc-800"
                                    >
                                        <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                                    </button>
                                )}
                                <div
                                    ref={categoryContainerRef}
                                    className="flex gap-2.5 overflow-x-auto py-1 pb-2 hide-scrollbar snap-x w-full px-4 scroll-smooth"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('all')}
                                        className={`flex flex-col items-center justify-center p-3 px-4 rounded-2xl border min-w-[110px] flex-shrink-0 snap-start transition-all ${
                                            selectedCategory === 'all'
                                                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                                                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-350 dark:hover:border-zinc-700 shadow-sm'
                                        }`}
                                    >
                                        <div className="p-2.5 rounded-xl mb-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450">
                                            <ShoppingCart className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t('All')}</span>
                                    </button>

                                    {categories.map((category, idx) => {
                                        const { icon, color } = getCategoryVisuals(category.name, idx + 1);
                                        const isSelected = selectedCategory === category.id.toString();
                                        return (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(category.id.toString())}
                                                className={`flex flex-col items-center justify-center p-3 px-4 rounded-2xl border min-w-[110px] flex-shrink-0 snap-start transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                                                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-350 dark:hover:border-zinc-700 shadow-sm'
                                                }`}
                                            >
                                                <div className={`p-2.5 rounded-xl mb-1.5 ${color}`}>
                                                    {icon}
                                                </div>
                                                <span className="text-xs font-bold text-slate-705 dark:text-zinc-300 whitespace-nowrap">{category.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {categories.length > 4 && (
                                    <button
                                        type="button"
                                        onClick={() => scrollCategories('right')}
                                        className="absolute -right-2 top-1/2 -translate-y-[60%] z-20 h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all dark:hover:bg-zinc-800"
                                    >
                                        <ChevronRight className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                                    </button>
                                )}
                            </div>

                            {/* Products Grid */}
                            <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-1 flex flex-col">
                                {loading ? (
                                    <div className="flex-grow flex flex-col items-center justify-center py-16 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('Loading products...')}</p>
                                    </div>
                                ) : filteredProducts.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                                            {displayedProducts.map(product => {
                                                const isLowStock = product.stock <= 10;
                                                const isOutOfStock = product.stock <= 0;
                                                const cartItem = cart.find(item => item.id === product.id);
                                                const quantityInCart = cartItem ? cartItem.quantity : 0;

                                                let stockBadgeClass = "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-450 dark:ring-emerald-900/30";
                                                if (isOutOfStock) {
                                                    stockBadgeClass = "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/30";
                                                } else if (isLowStock) {
                                                    stockBadgeClass = "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/30";
                                                }

                                                return (
                                                    <Card
                                                        key={product.id}
                                                        className={`cursor-pointer bg-white dark:bg-zinc-900 border border-slate-150/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 group flex flex-col justify-between ${
                                                            isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                                                        }`}
                                                        onClick={() => !isOutOfStock && addToCart(product)}
                                                    >
                                                        <CardContent className="p-2.5 flex flex-col h-full relative">
                                                            {/* Product Image Area */}
                                                            <div className="aspect-[4/3] bg-slate-50 dark:bg-zinc-955 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative border border-slate-100 dark:border-zinc-800/60">
                                                                {/* Stock Badge */}
                                                                {isOutOfStock ? (
                                                                    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/30">
                                                                        {t('Out')}
                                                                    </span>
                                                                ) : isLowStock ? (
                                                                    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/30">
                                                                        {t('Low')}
                                                                    </span>
                                                                ) : null}

                                                                {product.image ? (
                                                                    <img
                                                                        src={getImagePath(product.image)}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            const parent = target.parentElement;
                                                                            if (parent) {
                                                                                parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-8 h-8 text-slate-350" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Image className="w-8 h-8 text-slate-350 dark:text-zinc-650" />
                                                                )}
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex-1 flex flex-col justify-between">
                                                                <div>
                                                                    <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm truncate leading-snug group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                                                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{product.sku} • {product.category || t('General')}</p>
                                                                </div>

                                                                {/* Bottom Row */}
                                                                <div className="flex justify-between items-end mt-2">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-150">
                                                                            {formatCurrency(product.price)}
                                                                        </span>
                                                                        <div>
                                                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${stockBadgeClass}`}>
                                                                                {Math.floor(product.stock)} {t('Piece')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/10 active:scale-95 transition-all">
                                                                        <ShoppingCart className="h-4 w-4" />
                                                                        {quantityInCart > 0 && (
                                                                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-extrabold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900 select-none animate-in scale-in duration-200">
                                                                                {quantityInCart}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                        {filteredProducts.length > visibleCount && (
                                            <div className="flex justify-center mt-6 mb-4">
                                                <Button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {loadingMore ? t('Loading...') : t('Load More')}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50/10 dark:bg-zinc-950/5 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800/40 text-center min-h-[350px]">
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl mb-3.5 shrink-0">
                                            <Package className="h-10 w-10 text-slate-400 dark:text-zinc-650" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{t('No products available')}</p>
                                        <p className="text-xs text-slate-405 dark:text-zinc-500 mt-1.5 max-w-[280px] leading-relaxed">
                                            {t('Try selecting another category or check your warehouse products.')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cart Sidebar Card */}
                    <div className="w-full lg:w-85 xl:w-96 flex flex-col flex-shrink-0 min-h-0 order-1 lg:order-2 max-h-[50vh] lg:max-h-none">
                        {/* Customer Select Card */}
                        <Card className="border border-slate-150/60 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden p-4 bg-white dark:bg-zinc-900 flex-shrink-0">
                            {bankAccountField.map((field) => (
                                <div key={field.id} className="mb-2 text-xs">{field.component}</div>
                            ))}
                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">{t('Customer')}</label>
                            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger className="h-10 border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 rounded-xl text-slate-700 dark:text-zinc-300">
                                    <SelectValue placeholder={t('Walk-in Customer')} />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                    <SelectItem value="0">{t('Walk-in Customer')}</SelectItem>
                                    {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name} - {customer.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Card>

                        {/* Cart Items List Card */}
                        <Card className="flex-1 flex flex-col min-h-0 border border-slate-150/60 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 mt-3.5">
                            {/* Cart Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{t('Cart')}</span>
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-450 dark:ring-emerald-900/30">
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                </div>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setCart([])}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {t('Clear all')}
                                    </button>
                                )}
                            </div>

                            {/* Cart Scroll Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                                        <div className="h-14 w-14 bg-slate-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mb-3 border border-slate-100 dark:border-zinc-850">
                                            <ShoppingCart className="h-6 w-6 text-slate-400 dark:text-zinc-600" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t('Your cart is empty')}</p>
                                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{t('Add products to get started')}</p>
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const isMaxStock = item.quantity >= item.stock;
                                        return (
                                            <div key={item.id} className="p-3 bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800/85 rounded-xl shadow-sm space-y-2.5 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-705 transition-all duration-200">
                                                <div className="flex items-start gap-3">
                                                    {/* Item Image */}
                                                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {item.image ? (
                                                            <img
                                                                src={getImagePath(item.image)}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Image className="w-5 h-5 text-slate-350 dark:text-zinc-650" />
                                                        )}
                                                    </div>
                                                    {/* Item Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{item.name}</h4>
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{item.sku}</p>
                                                    </div>
                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 0)}
                                                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                {/* Quantity Controls & Price */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg p-0.5">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-zinc-200">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            disabled={isMaxStock}
                                                            className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 disabled:opacity-30"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Price / Subtotal */}
                                                    <div className="text-right">
                                                        <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-150">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </span>
                                                        <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                                            {formatCurrency(item.price)} {t('each')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Warnings / Taxes */}
                                                {isMaxStock && (
                                                    <div className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-450 dark:ring-amber-900/30 gap-1 mt-1">
                                                        <span>⚠</span>
                                                        <span>{t('Max stock reached')} ({item.stock} {t('Piece')})</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Cart Calculations Summary */}
                            {cart.length > 0 && (
                                <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5 bg-slate-50/20 dark:bg-zinc-950/20 flex-shrink-0">
                                    {/* Discount Input */}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{t('Discount')}</span>
                                        <div className="relative w-24">
                                            <Input
                                                type="number"
                                                value={discountAmount || ''}
                                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                                className="h-8 text-right text-xs border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 rounded-lg pr-2"
                                                min="0"
                                                max={getSubtotal() + getTaxAmount()}
                                            />
                                        </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                        <span>{t('Subtotal')}</span>
                                        <span>{formatCurrency(getSubtotal())}</span>
                                    </div>

                                    {/* Tax Breakdown */}
                                    {getTaxBreakdown().map((tax, index) => (
                                        <div key={index} className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                            <span>{tax.name}</span>
                                            <span>{formatCurrency(tax.amount)}</span>
                                        </div>
                                    ))}
                                    {getTaxBreakdown().length === 0 && (
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                            <span>{t('Tax')}</span>
                                            <span>{formatCurrency(getTaxAmount())}</span>
                                        </div>
                                    )}

                                    {/* Grand Total */}
                                    <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-200 dark:border-zinc-800">
                                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{t('Grand Total')}</span>
                                        <span className="text-lg font-black text-emerald-650 dark:text-emerald-450">{formatCurrency(getTotal())}</span>
                                    </div>

                                    {/* Checkout Button */}
                                    <div className="pt-2">
                                        <Button
                                            onClick={() => {
                                                if (!data.bank_account_id) {
                                                    setErrors((prev: any) => ({
                                                        ...prev,
                                                        bank_account_id: t('Please select a bank account.')
                                                    }));
                                                    return;
                                                }
                                                setPaidAmount(getTotal().toString());
                                                setShowPaymentModal(true);
                                            }}
                                            disabled={cart.length === 0 || !selectedWarehouse}
                                            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <CreditCard className="h-4.5 w-4.5" />
                                            <span>{t('Checkout')}</span>
                                            <span>•</span>
                                            <span>{formatCurrency(getTotal())}</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
             <Dialog open={showPaymentModal} onOpenChange={(open) => !processing && setShowPaymentModal(open)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-none">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{t('Process Payment')}</DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 p-4">
                        {/* Header Info */}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                            {/* Left Side - POS Details */}
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">{t('POS Number')}: </span>
                                    <span>{nextPosNumber}</span>
                                </div>
                                <div>
                                    <span className="font-medium">{t('Date')}: </span>
                                    <span>{formatDate(new Date())}</span>
                                </div>
                                <div>
                                    <span className="font-medium">{t('Customer')}: </span>
                                    <span>{selectedCustomer ? customers.find(c => c.id.toString() === selectedCustomer)?.name : t('Walk-in Customer')}</span>
                                </div>
                                <div>
                                    <span className="font-medium">{t('Warehouse')}: </span>
                                    <span>{warehouses.find(w => w.id.toString() === selectedWarehouse)?.name}</span>
                                </div>
                            </div>

                            {/* Right Side - Company Details */}
                            <div className="text-right space-y-1 text-sm">
                                <h2 className="text-lg font-bold">{globalSettings?.company_name || 'Company Name'}</h2>
                                <p>{globalSettings?.company_address || 'Company Address'}</p>
                                <p>{globalSettings?.company_city || 'City'}, {globalSettings?.company_state || 'State'}</p>
                                <p>{globalSettings?.company_country || 'Country'} - {globalSettings?.company_zipcode || 'Zipcode'}</p>
                            </div>
                        </div>

                        {/* Products Table */}
                        <Card className="mb-4">
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Product')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('Qty')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Price')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('Taxes')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Tax Amount')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {cart.map((item) => {
                                            const itemSubtotal = item.price * item.quantity;
                                            let itemTaxAmount = 0;
                                            let taxDisplay = '';
                                            if (item.taxes && item.taxes.length > 0) {
                                                const taxNames = item.taxes.map(tax => {
                                                    itemTaxAmount += (itemSubtotal * tax.rate) / 100;
                                                    return `${tax.name} (${tax.rate}%)`;
                                                });
                                                taxDisplay = taxNames.join(', ');
                                            } else {
                                                taxDisplay = 'No Tax';
                                            }
                                            return (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.price)}</td>
                                                    <td className="px-4 py-3 text-center text-sm">
                                                        <div className="text-xs">{taxDisplay}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(itemTaxAmount)}</td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(itemSubtotal + itemTaxAmount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Totals */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Subtotal')}:</span>
                                        <span>{formatCurrency(getSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Tax')}:</span>
                                        <span>{formatCurrency(getTaxAmount())}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Discount')}:</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('Total')}:</span>
                                        <span className="text-green-600">{formatCurrency(getTotal())}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={handlePayment} disabled={processing}>
                                {processing ? t('Processing...') : t('Complete Sale')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={handlePaymentComplete}
                completedSale={completedSale}
                globalSettings={globalSettings}
            />
        </>
    );
}

export default function Create(props: CreateProps) {
    return (
        <BrandProvider>
            <CreateContent {...props} />
        </BrandProvider>
    );
}
