import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function ThemedAlertModal({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'error' | 'warning' | 'locked'
  icon,
  primaryText = 'OK',
  secondaryText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  options, // Array of { id, title, subtitle, onPress }
  children,
}) {
  if (!visible) return null;

  const handleClose = onSecondaryPress || onClose || onPrimaryPress;

  // Icon configuration based on type
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          iconName: icon || 'checkmark',
          bgColor: '#DCFCE7',
          borderColor: '#BBF7D0',
          color: '#15803D',
          isFA: false,
        };
      case 'error':
        return {
          iconName: icon || 'alert-circle',
          bgColor: '#FEE2E2',
          borderColor: '#FECACA',
          color: '#DC2626',
          isFA: false,
        };
      case 'warning':
        return {
          iconName: icon || 'warning',
          bgColor: '#FEF3C7',
          borderColor: '#FDE68A',
          color: '#D97706',
          isFA: false,
        };
      case 'locked':
        return {
          iconName: icon || 'lock',
          bgColor: '#EDE9FE',
          borderColor: '#DDD6FE',
          color: '#4326B6',
          isFA: true,
        };
      case 'info':
      default:
        return {
          iconName: icon || 'information',
          bgColor: '#EDE9FE',
          borderColor: '#DDD6FE',
          color: '#4326B6',
          isFA: false,
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Top Badge Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: iconConfig.bgColor, borderColor: iconConfig.borderColor },
            ]}
          >
            {iconConfig.isFA ? (
              <FontAwesome5 name={iconConfig.iconName} size={22} color={iconConfig.color} />
            ) : (
              <Ionicons name={iconConfig.iconName} size={26} color={iconConfig.color} />
            )}
          </View>

          {/* Title */}
          {Boolean(title) && <Text style={styles.modalTitle}>{title}</Text>}

          {/* Message */}
          {Boolean(message) && <Text style={styles.modalMessage}>{message}</Text>}

          {/* Selectable Options if provided */}
          {Array.isArray(options) && options.length > 0 && (
            <View style={styles.optionsList}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionItem,
                    opt.selected && styles.optionItemSelected,
                  ]}
                  onPress={opt.onPress}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionTitle,
                        opt.selected && styles.optionTitleSelected,
                      ]}
                    >
                      {opt.title}
                    </Text>
                    {Boolean(opt.subtitle) && (
                      <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                    )}
                  </View>
                  <Ionicons
                    name={opt.selected ? 'checkmark-circle' : 'chevron-forward'}
                    size={18}
                    color={opt.selected ? '#4326B6' : '#94A3B8'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Custom Children */}
          {children}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {Boolean(secondaryText) && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSecondaryPress || onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>{secondaryText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                type === 'error' && styles.primaryBtnDanger,
                !secondaryText && { flex: 1 },
              ]}
              onPress={onPrimaryPress || onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 68, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 348,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: '#1E1B4B',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  optionsList: {
    width: '100%',
    gap: 8,
    marginBottom: 18,
  },
  optionItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionItemSelected: {
    borderColor: '#4326B6',
    backgroundColor: '#EDE9FE',
  },
  optionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#1E293B',
  },
  optionTitleSelected: {
    color: '#4326B6',
  },
  optionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 13.5,
    color: '#475569',
  },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnDanger: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  primaryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
