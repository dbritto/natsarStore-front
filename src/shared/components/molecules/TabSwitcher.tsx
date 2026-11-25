import React from 'react';
import { Icon, IconName } from '../atoms/Icon';

export interface TabSwitcherItem<T extends string = string> {
  id: T;
  label: string;
  icon?: IconName;
  count?: number;
}

export interface TabSwitcherProps<T extends string = string> {
  tabs: TabSwitcherItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
}

/**
 * Molécula TabSwitcher (src/shared/components/molecules):
 * Selector de pestañas tipo píldora estilo DealDeck reutilizable en cualquier módulo.
 */
export function TabSwitcher<T extends string = string>({
  tabs,
  activeTab,
  onChange,
}: TabSwitcherProps<T>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px',
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: '0 4px 14px -6px rgba(15, 23, 42, 0.05)',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.83rem',
              fontWeight: isActive ? 700 : 600,
              backgroundColor: isActive ? '#4D53F4' : 'transparent',
              color: isActive ? '#FFFFFF' : '#64748B',
              boxShadow: isActive ? '0 8px 18px -6px rgba(77, 83, 244, 0.45)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.icon && <Icon name={tab.icon} size={16} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#475569',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
