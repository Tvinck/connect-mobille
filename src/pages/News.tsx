import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { NotificationItem } from '../components/content/NotificationItem';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

const mockNews = [
  { id: '1', title: 'Обновили выдачу сертификатов', content: 'Теперь ключи Apple Certs приходят клиенту автоматически после согласования заявки.', tags: ['BAZZAR SERTS'], created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '2', title: 'Новые локации серверов', content: 'Добавили Японию и Бразилию — расскажите клиентам при обращении.', tags: ['Veil VPN'], created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: '3', title: 'Новый Бизнес StandUp на базе', content: 'Технологи, гики и дизайнеры — про то, как рождаются продукты, интерфейсы и мемы.', tags: ['Компания'], created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
  { id: '4', title: 'Бери максимум от лета', content: 'В дайджесте: горячие новости, конкурсы и домашка от лидеров.', tags: ['Компания'], created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString() },
];

interface NewsProps {
  onBack: () => void;
}

export function News({ onBack }: NewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setNews(data as NewsItem[]);
        } else {
          setNews(mockNews);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setNews(mockNews); // Use mock as fallback on error
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getIconInfo = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('vpn') || tagLower.includes('veil')) return { icon: 'shield', color: '#4cd964' };
    if (tagLower.includes('serts') || tagLower.includes('certs') || tagLower.includes('bazzar')) return { icon: 'newspaper', color: 'var(--amber)' };
    return { icon: 'megaphone', color: 'var(--violet)' };
  };

  return (
    <div style={{ paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Новости" onBack={onBack} />
      <div style={{ padding: '0 var(--screen-pad)' }}>
        {loading && news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Загрузка новостей...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {news.map((n) => {
              const dt = new Date(n.created_at);
              const dateStr = dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
              const timeStr = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              const category = n.tags && n.tags.length > 0 ? n.tags[0] : 'Компания';
              const { icon, color } = getIconInfo(category);

              return (
                <NotificationItem
                  key={n.id}
                  category={category}
                  date={dateStr}
                  time={timeStr}
                  icon={icon}
                  iconColor={color}
                  title={n.title}
                  text={n.content}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
