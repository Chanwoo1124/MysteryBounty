package com.example.mysterybounty.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 주민번호 AES-256-GCM 암복호화 및 마스킹.
 * <ul>
 *   <li>저장: {@link #encrypt(String)} — [IV(12B) + 암호문]을 Base64 로 저장</li>
 *   <li>화면/API: {@link #mask(String)} — {@code 910312-1******} 형태로 마스킹</li>
 *   <li>엑셀(원천징수): {@link #decrypt(String)} — 원본 복호화</li>
 * </ul>
 */
@Component
public class SsnCipher {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;      // GCM 권장 IV 길이
    private static final int TAG_LENGTH_BIT = 128;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public SsnCipher(@Value("${app.ssn.aes-key}") String rawKey) {
        // 임의 길이의 키 문자열을 SHA-256 으로 256bit 키로 파생
        this.key = new SecretKeySpec(sha256(rawKey), "AES");
    }

    /** 평문 주민번호 → 암호화 문자열 (null/빈값은 그대로 반환) */
    public String encrypt(String plain) {
        if (plain == null || plain.isBlank()) {
            return plain;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] cipherText = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("주민번호 암호화 실패", e);
        }
    }

    /** 암호화 문자열 → 평문 (엑셀 내보내기 등 인가된 경로에서만 사용) */
    public String decrypt(String stored) {
        if (stored == null || stored.isBlank()) {
            return stored;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(stored);
            byte[] iv = new byte[IV_LENGTH];
            byte[] cipherText = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("주민번호 복호화 실패", e);
        }
    }

    /** 암호화 저장값 → 마스킹 문자열 (앞 6자리 + 성별 1자리, 나머지 마스킹) */
    public String maskFromEncrypted(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        return mask(decrypt(stored));
    }

    /** 평문 주민번호 → 마스킹 (예: 9103121234567 → 910312-1******) */
    public static String mask(String plain) {
        if (plain == null || plain.isBlank()) {
            return null;
        }
        String digits = plain.replaceAll("\\D", "");
        if (digits.length() < 7) {
            // 형식이 예상과 다르면 전부 마스킹
            return "*".repeat(Math.max(digits.length(), 1));
        }
        String front = digits.substring(0, 6);
        char gender = digits.charAt(6);
        return front + "-" + gender + "******";
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("키 파생 실패", e);
        }
    }
}
