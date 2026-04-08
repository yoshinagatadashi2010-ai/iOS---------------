# PromptWeaver Web

PromptWeaver �� iPhone / Android / Windows / Mac �̃u���E�U�Ŏg����悤�ɂ��� PWA �łł��B

## �ł��邱��

- �摜 / ����v�����v�g�̍쐬�ƕҏW
- Markdown �v���r���[
- Markdown / JSON �̏����o��
- �R�s�[ / ���L
- �u���E�U��ۑ�
- �z�[����ʒǉ� / �I�t���C���N��
- ���L�p URL �� QR �R�[�h�\��

## ���[�J���N��

`PromptWeaverWeb` �t�H���_�Ŏ��s���܂��B

```bash
npm run serve
```

�J���� URL:

- `http://localhost:4173/`

���� Wi-Fi ��̃X�}�z�Ŏ����Ƃ��́APC �� IP �A�h���X��g���Ď��̂悤�ɊJ���܂��B

- `http://<PC��IP�A�h���X>:4173/`

��:

- `http://192.168.1.20:4173/`

## �e�X�g

```bash
npm test
```

## QR�R�[�h�ŃX�}�z����J��

1. PromptWeaver Web �� PC �ŊJ��
2. `�ݒ�` ��J��
3. `���L�pURL` �Ɍ��J URL �� LAN �� URL ������
4. �\�����ꂽ QR �R�[�h��X�}�z�œǂݎ��
5. iPhone �� Safari �ŊJ���āu�z�[����ʂɒǉ��v��I��

### ����

- `localhost` �� `127.0.0.1` �̓X�}�z����J���܂���
- ���� Wi-Fi �Ŏ����Ȃ� `http://192.168.x.x:4173/` �̂悤�� LAN �� URL ��g���܂�
- �ӂ���g������Ȃ� HTTPS �̌��J URL ��g���̂��������߂ł�

## iPhone �Ŏg��

### �܂�����

1. PC �� `npm run serve` ����s����
2. iPhone �𓯂� Wi-Fi �ɐڑ�����
3. Safari �� `http://<PC��IP�A�h���X>:4173/` ��J��

### �ӂ���g������

1. HTTPS �Ō��J�ł���ÓI�z�X�e�B���O�֔z�u����
2. iPhone �� Safari �ŊJ��
3. ���L���j���[����u�z�[����ʂɒǉ��v��I��

HTTPS �Ō��J����ƁA�z�[����ʒǉ���̃A�v���炵�������T�[�r�X���[�J�[�ɂ��I�t���C�����p�����肵�܂��B

## ���J���@�̍l����

���̃A�v���͐ÓI�t�@�C�������œ����܂��B�r���h�s�v�ŁA`PromptWeaverWeb` �t�H���_�̒��g����̂܂܌��J�ł��܂��B

�g���₷�����:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Firebase Hosting

���J���� URL �� `�ݒ�` �� `���L�pURL` �ɓ����ƁA���� URL �p�� QR �R�[�h���\������܂��B

## Windows �Ŏg��

1. Edge �܂��� Chrome �ŊJ��
2. �C���X�g�[���{�^���A�܂��̓��j���[����A�v���Ƃ��ăC���X�g�[������

## �⑫

- �f�[�^�̓u���E�U�̃��[�J���X�g���[�W�ɕۑ�����܂�
- �[����܂��������������͂܂������Ă��܂���
- `.md` �� `.json` ������o���Ď蓮�Ŏ󂯓n���ł��܂�
- �����I�ɃN���E�h������o�����C���|�[�g�𑫂���悤�A�f�[�^�\���͕����Ă���܂�
- ���݂� QR �R�[�h�\���͊O���� QR �摜�T�[�r�X��g���Ă��܂�
