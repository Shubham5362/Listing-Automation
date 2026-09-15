import io
from PIL import Image
from app.services.vision_ai import analyze_image

def test_vision_quality(monkeypatch):
    buf=io.BytesIO(); Image.new("RGB",(1600,1600),"white").save(buf,format="PNG")
    class R:
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def read(self,n=-1): return buf.getvalue()
    monkeypatch.setattr("app.services.vision_ai.urllib.request.urlopen",lambda *a,**k:R())
    result=analyze_image("https://example.com/a.png")
    assert result["width"]==1600
    assert 0 <= result["quality_score"] <= 100
    assert result["confidence"] > 0

def test_vision_rejects_oversized(monkeypatch):
    monkeypatch.setattr("app.services.vision_ai.urllib.request.urlopen",lambda *a,**k:type("R",(),{"__enter__":lambda s:s,"__exit__":lambda *a:None,"read":lambda s,n=-1:b"x"*(8*1024*1024+1)})())
    try: analyze_image("https://example.com/a.png"); assert False
    except ValueError as exc: assert "8MB" in str(exc)
