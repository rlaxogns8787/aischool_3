import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { ChevronRight, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } catch (error) {
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  const menuItems = [
    { label: '알림 설정', onPress: () => {} },
    { label: '문의하기', onPress: () => {} },
    { label: '공지사항', onPress: () => {} },
    { label: '이용약관', onPress: () => {} },
    { label: '개인정보 처리 방침', onPress: () => {} },
    { label: '사용 가이드', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
        >
          <X size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{'{nickname}'}</Text>
            <Text style={styles.editProfile}>프로필 편집</Text>
          </View>
          <ChevronRight size={32} color="#C5C6CC" />
        </View>
      </View>

      <View style={styles.menuSection}>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 305,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 54,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 10,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#B4DBFF',
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  editProfile: {
    fontSize: 12,
    color: '#A4A4A4',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  menuList: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  bottomSection: {
    marginTop: 'auto',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    padding: 22,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF0000',
  },
  bannerSection: {
    height: 94,
    backgroundColor: '#EAF2FF',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 15,
  },
  banner: {
    flex: 1,
    width: '100%',
  },
  adLabel: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F2024',
    opacity: 0.1,
  },
  activeDot: {
    backgroundColor: '#006FFD',
    opacity: 1,
  },
}); 