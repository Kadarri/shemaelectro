import re,sys
src=open('/home/claude/app/index.html').read()
FB='10.12.2'
head=('<script src="https://www.gstatic.com/firebasejs/%s/firebase-app-compat.js"></script>\n'
      '<script src="https://www.gstatic.com/firebasejs/%s/firebase-auth-compat.js"></script>\n'
      '<script src="https://www.gstatic.com/firebasejs/%s/firebase-firestore-compat.js"></script>\n'
      '<script src="shim.js?v=%s"></script>\n'
      '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-192.png">\n'
      '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#141413">\n') % (FB,FB,FB,sys.argv[1] if len(sys.argv)>1 else '1')
m=re.search(r'<meta charset="[^"]*">',src); assert m
src=src[:m.end()]+'\n'+head+src[m.end():]
src=re.sub(r'<title>.*?</title>','<title>Shema Electro</title>',src,count=1,flags=re.S)
open('/home/claude/shemaelectro/app/index.html','w').write(src)
print('ok',len(src))
