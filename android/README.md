# APK do totem (Bubblewrap, só sideload)

APK de teste: **não** vai para a Play Store, então não aparece para ninguém.
Você instala direto no tablet/TV.

## Requisitos (na sua máquina)
- Node 18+ e JDK 17. O Bubblewrap baixa o Android SDK sozinho na primeira vez.

## Passo a passo
1. Troque `tarefas-da-casa.vercel.app` em `twa-manifest.json` pelo domínio do deploy.
2. Na pasta `android/`:
   ```bash
   npx @bubblewrap/cli init --manifest=https://tarefas-da-casa.vercel.app/manifest.json
   # (ou use o twa-manifest.json daqui: npx @bubblewrap/cli build)
   npx @bubblewrap/cli build
   ```
   Ele cria a keystore (guarde a senha) e gera `app-release-signed.apk`.
3. Para a barra de endereço sumir, publique o `assetlinks.json`:
   ```bash
   npx @bubblewrap/cli fingerprint list   # copie o SHA-256
   ```
   Crie `public/.well-known/assetlinks.json` e faça o deploy:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "app.tarefinha.totem",
       "sha256_cert_fingerprints": ["COLE_O_SHA256_AQUI"]
     }
   }]
   ```
4. Instale: copie o APK para o aparelho (ou `adb install app-release-signed.apk`)
   e permita "instalar apps desconhecidos".

## Android TV
Para aparecer no menu da TV, edite o `AndroidManifest.xml` gerado e adicione
`<category android:name="android.intent.category.LEANBACK_LAUNCHER"/>` na activity
principal, mais um banner de 320x180 (`android:banner`). Alternativa: abrir pelo
launcher alternativo "Sideload Launcher".

**Não commite** `android.keystore` nem as senhas.
