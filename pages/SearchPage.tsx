import React, { useState, useCallback } from 'react';
import { Search, AlertCircle, MapPin, ArrowDownUp, Filter, Check, List, Map as MapIcon, Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { searchMedicines, searchAlternatives } from '../services/searchService';
import { findNearbyPharmaciesWithAI, AIMapsResult } from '../services/aiMapsService';
import { SearchResult } from '../types';
import { calculateDistance } from '../utils/distance';
import { isPharmacyOpen } from '../utils/pharmacy';
import { SearchInput } from '../components/SearchInput';
import { ResultCard } from '../components/ResultCard';
import { ResultsMap } from '../components/ResultsMap';

export default function SearchPage() {
  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [alternatives, setAlternatives] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Maps State
  const [aiMapsLoading, setAiMapsLoading] = useState(false);
  const [aiMapsResult, setAiMapsResult] = useState<AIMapsResult | null>(null);

  // Filters & Location State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'distance'>('default');
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleRequestLocation = () => {
    if (userLocation) {
      setSortBy('distance');
      return;
    }

    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSortBy('distance');
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("تعذر الحصول على موقعك. يرجى التأكد من تفعيل خدمات الموقع في متصفحك.");
          setLocationLoading(false);
          setSortBy('default');
        }
      );
    } else {
      alert("متصفحك لا يدعم تحديد الموقع.");
      setLocationLoading(false);
    }
  };

  const filterAndSortResults = useCallback((items: SearchResult[]) => {
    let filteredItems = items;

    if (filterInStock) {
      filteredItems = filteredItems.filter(item => item.quantity > 0);
    }

    if (filterOpenNow) {
      filteredItems = filteredItems.filter(item => isPharmacyOpen(item.pharmacies));
    }

    if (sortBy === 'default') return filteredItems;

    return [...filteredItems].sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      }
      if (sortBy === 'distance' && userLocation && a.pharmacies.latitude && a.pharmacies.longitude && b.pharmacies.latitude && b.pharmacies.longitude) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.pharmacies.latitude, a.pharmacies.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.pharmacies.latitude, b.pharmacies.longitude);
        return distA - distB;
      }
      return 0;
    });
  }, [sortBy, filterInStock, filterOpenNow, userLocation]);

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);
    setAlternatives([]);
    setAiMapsResult(null);

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'search', {
        search_term: searchQuery
      });
    }

    try {
      const data = await searchMedicines(searchQuery, userLocation?.lat, userLocation?.lng);
      setResults(data);

      if (data.length === 0) {
        const alts = await searchAlternatives(searchQuery);
        setAlternatives(alts);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-primary-800 mb-4">
          ابحث عن دوائك بسهولة
        </h1>
        <p className="text-gray-500 text-lg">
          دليل صيدليات "صاد" يساعدك في العثور على الأدوية المتوفرة في الصيدليات القريبة منك.
        </p>
      </div>

      <section className="mb-12">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSearch={() => handleSearch(query)}
          loading={loading}
          onKeyDown={handleKeyDown}
        />

        {!hasSearched && !loading && (
          <div className="mt-6 text-center animate-in fade-in duration-500">
            <p className="text-sm text-gray-500 mb-3">اقتراحات شائعة:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Panadol', 'Brufen', 'Vitamin C', 'Omeprazole', 'Loratadine'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section aria-live="polite">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {hasSearched && !loading && (results.length > 0 || alternatives.length > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-700 ml-2">ترتيب:</span>
              <button
                onClick={() => setSortBy('default')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sortBy === 'default' ? 'bg-primary-100 text-primary-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                الافتراضي
              </button>
              <button
                onClick={() => setSortBy('price')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${sortBy === 'price' ? 'bg-primary-100 text-primary-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <ArrowDownUp size={14} />
                الأقل سعراً
              </button>
              <button
                onClick={handleRequestLocation}
                disabled={locationLoading}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${sortBy === 'distance' ? 'bg-primary-100 text-primary-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'} ${locationLoading ? 'opacity-70 cursor-wait' : ''}`}
              >
                <MapPin size={14} />
                {locationLoading ? 'جاري التحديد...' : 'الأقرب'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:border-r sm:border-gray-200 sm:pr-4">
              <span className="text-sm font-bold text-gray-700 ml-2 flex items-center gap-1">
                <Filter size={14} /> تصفية:
              </span>
              <button
                onClick={() => setFilterInStock(!filterInStock)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${filterInStock ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {filterInStock && <Check size={14} />}
                متوفر فقط
              </button>
              <button
                onClick={() => setFilterOpenNow(!filterOpenNow)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${filterOpenNow ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {filterOpenNow && <Check size={14} />}
                مفتوحة الآن
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg sm:border-r sm:border-gray-200 sm:pr-4">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <List size={16} />
                قائمة
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <MapIcon size={16} />
                خريطة
              </button>
            </div>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && alternatives.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 relative">
              <Search className="w-10 h-10 text-gray-300" />
              <div className="absolute -bottom-1 -right-1 bg-red-50 text-red-500 rounded-full p-1.5 border-2 border-white">
                <AlertCircle size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">عذراً، لم نجد نتائج لبحثك</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto mb-6">
              تأكد من كتابة اسم الدواء بشكل صحيح، أو جرب البحث بالاسم العلمي.
            </p>
            <button
              onClick={() => {
                setQuery('');
                const input = document.querySelector('input');
                if (input) input.focus();
              }}
              className="text-primary-600 font-bold hover:text-primary-700 hover:underline mb-6 block mx-auto"
            >
              مسح البحث والمحاولة مجدداً
            </button>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                البحث الذكي عبر خرائط جوجل
              </h4>
              <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">
                يمكننا استخدام الذكاء الاصطناعي للبحث عن صيدليات قريبة منك على خرائط جوجل قد يتوفر فيها هذا الدواء.
              </p>

              {aiMapsResult ? (
                <div className="text-right bg-gray-50 p-6 rounded-2xl border border-gray-200 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={() => setAiMapsResult(null)}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm border border-gray-100 transition-colors"
                    title="إغلاق"
                  >
                    <X size={16} />
                  </button>
                  <div className="text-sm mb-4 text-gray-700 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:mr-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:mr-6 [&>ol]:mb-4 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-2 [&_strong]:text-gray-900">
                    <ReactMarkdown>{aiMapsResult.text}</ReactMarkdown>
                  </div>
                  {aiMapsResult.places.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      <strong className="text-gray-800">روابط سريعة:</strong>
                      {aiMapsResult.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-colors"
                        >
                          <MapPin size={16} />
                          {place.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setAiMapsLoading(true);
                    try {
                      const result = await findNearbyPharmaciesWithAI(query, userLocation?.lat, userLocation?.lng);
                      setAiMapsResult(result);
                    } catch (err) {
                      console.error(err);
                      alert("حدث خطأ أثناء البحث الذكي.");
                    } finally {
                      setAiMapsLoading(false);
                    }
                  }}
                  disabled={aiMapsLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {aiMapsLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      جاري البحث الذكي...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      ابحث بالذكاء الاصطناعي
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && alternatives.length > 0 && !error && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
              <h3 className="text-xl font-bold text-amber-800 mb-2">الدواء المطلوب غير متوفر حالياً</h3>
              <p className="text-amber-700">ولكن وجدنا بدائل تحتوي على نفس المادة الفعالة (الاسم العلمي):</p>
            </div>
            {viewMode === 'map' ? (
              <ResultsMap results={filterAndSortResults(alternatives)} userLocation={userLocation} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterAndSortResults(alternatives).map((item) => (
                  <ResultCard key={item.id} data={item} userLocation={userLocation} />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'map' && results.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultsMap results={filterAndSortResults(results)} userLocation={userLocation} />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterAndSortResults(results).map((item) => (
              <ResultCard key={item.id} data={item} userLocation={userLocation} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
